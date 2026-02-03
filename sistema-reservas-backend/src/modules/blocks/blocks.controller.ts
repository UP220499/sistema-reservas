import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { BlockQueryDto } from './dto/block-query.dto';
import { ChangeBlockStatusDto } from './dto/change-block-status.dto';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(@Body() dto: CreateBlockDto): Promise<any> {
    return this.blocksService.create(dto);
  }

  @Get()
  findAll(@Query() query: BlockQueryDto): Promise<any> {
    return this.blocksService.findAll(query);
  }

  @Get(':bloqueo_id')
  findOne(@Param('bloqueo_id') bloqueoId: string): Promise<any> {
    return this.blocksService.findOne(bloqueoId);
  }

  @Patch(':bloqueo_id/status')
  changeStatus(
    @Param('bloqueo_id') bloqueoId: string,
    @Body() dto: ChangeBlockStatusDto,
  ): Promise<any> {
    return this.blocksService.changeStatus(bloqueoId, dto.estatus_bloqueo);
  }
}
