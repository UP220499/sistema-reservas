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
import { BlockResponse } from './mappers/block.mapper';
import { ApiTags } from '@nestjs/swagger';

interface BlockListResponse {
  items: BlockResponse[];
  page: number;
  page_size: number;
  total: number;
}

@ApiTags('Bloqueos')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(@Body() dto: CreateBlockDto): Promise<BlockResponse> {
    return this.blocksService.create(dto);
  }

  @Get()
  findAll(@Query() query: BlockQueryDto): Promise<BlockListResponse> {
    return this.blocksService.findAll(query);
  }

  @Get(':bloqueo_id')
  findOne(@Param('bloqueo_id') bloqueoId: string): Promise<BlockResponse> {
    return this.blocksService.findOne(bloqueoId);
  }

  @Patch(':bloqueo_id/status')
  changeStatus(
    @Param('bloqueo_id') bloqueoId: string,
    @Body() dto: ChangeBlockStatusDto,
  ): Promise<BlockResponse> {
    return this.blocksService.changeStatus(bloqueoId, dto.estatus_bloqueo);
  }
}
