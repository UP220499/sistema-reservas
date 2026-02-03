import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { BlocksRepository } from './prisma/blocks.repository';

@Module({
  imports: [PrismaModule],
  controllers: [BlocksController],
  providers: [BlocksService, BlocksRepository],
})
export class BlocksModule {}
