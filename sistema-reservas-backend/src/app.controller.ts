import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('favicon.ico')
  getFavicon(): void {
    // Returns 200 OK with empty body by default, valid enough to stop 404 logs.
    // Or we can set status to 204 if we want to be more specific, but void is fine.
    return;
  }

  @Get('health/db')
  async getDatabaseHealth(): Promise<{ ok: true }> {
    await this.prisma.$executeRaw`SELECT 1`;
    return { ok: true };
  }
}
