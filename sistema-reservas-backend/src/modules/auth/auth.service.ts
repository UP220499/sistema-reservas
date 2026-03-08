import { StringValue } from 'ms';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface ProfileResponse {
  usuario_id: string;
  nombre: string;
  username: string;
  rol_code: string;
}

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    this.refreshSecret = secret + '-refresh';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.usuario.findUnique({
      where: { username: dto.username },
      select: {
        usuario_id: true,
        username: true,
        password_hash: true,
        rol_code: true,
        activo: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new ForbiddenException('Usuario desactivado');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user.usuario_id, user.username, user.rol_code);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { usuario_id: BigInt(payload.sub) },
      select: {
        usuario_id: true,
        username: true,
        rol_code: true,
        activo: true,
      },
    });

    if (!user || !user.activo) {
      throw new ForbiddenException('Usuario no encontrado o desactivado');
    }

    return this.generateTokens(user.usuario_id, user.username, user.rol_code);
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.usuario.findUnique({
      where: { usuario_id: BigInt(userId) },
      select: {
        usuario_id: true,
        nombre: true,
        username: true,
        rol_code: true,
        activo: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.activo) {
      throw new UnauthorizedException('User is inactive');
    }

    return {
      usuario_id: user.usuario_id.toString(),
      nombre: user.nombre,
      username: user.username,
      rol_code: user.rol_code,
    };
  }

  private generateTokens(
    usuarioId: bigint,
    username: string,
    rolCode: string,
  ): TokenPair {
    const payload: JwtPayload = {
      sub: usuarioId.toString(),
      username,
      rol: rolCode,
    };

    const access_token = this.jwtService.sign(payload);

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn as StringValue,
    });

    return { access_token, refresh_token };
  }
}
