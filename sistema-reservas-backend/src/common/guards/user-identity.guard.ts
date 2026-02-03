import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_USER_KEY } from '../decorators/require-user.decorator';

interface HttpRequestLike {
  headers?: Record<string, string | string[] | undefined>;
  auditUserId?: bigint;
}

@Injectable()
export class UserIdentityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresUser = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_USER_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<HttpRequestLike>();
    const headerValue = this.extractUserIdHeader(request);

    if (headerValue === undefined) {
      if (requiresUser) {
        throw new UnauthorizedException('x-user-id header is required');
      }

      request.auditUserId = undefined;
      return true;
    }

    if (!/^[0-9]+$/.test(headerValue)) {
      throw new BadRequestException('x-user-id must be a numeric string');
    }

    const userId = BigInt(headerValue);

    const user = await this.prismaService.usuario.findUnique({
      where: { usuario_id: userId },
      select: { usuario_id: true, activo: true },
    });

    if (!user || !user.activo) {
      throw new ForbiddenException('User is not allowed');
    }

    request.auditUserId = userId;

    return true;
  }

  private extractUserIdHeader(request: HttpRequestLike): string | undefined {
    const headers = request.headers;

    if (!headers) {
      return undefined;
    }

    const value = headers['x-user-id'];

    if (Array.isArray(value)) {
      return value[0]?.trim();
    }

    return value?.trim();
  }
}
