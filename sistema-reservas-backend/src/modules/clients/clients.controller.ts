import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddPhoneDto } from './dto/add-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Query() query: ClientQueryDto): Promise<any> {
    return this.clientsService.findAll(query);
  }

  @Get(':clientId')
  findOne(@Param('clientId') clientId: string): Promise<any> {
    return this.clientsService.findOne(clientId);
  }

  @Post()
  create(@Body() dto: CreateClientDto): Promise<any> {
    return this.clientsService.create(dto);
  }

  @Put(':clientId')
  update(
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientDto,
  ): Promise<any> {
    return this.clientsService.update(clientId, dto);
  }

  @Patch(':clientId/status')
  changeStatus(
    @Param('clientId') clientId: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<any> {
    return this.clientsService.changeStatus(clientId, dto.active);
  }

  @Post(':clientId/phones')
  addPhone(
    @Param('clientId') clientId: string,
    @Body() dto: AddPhoneDto,
  ): Promise<any> {
    return this.clientsService.addPhone(clientId, dto);
  }

  @Patch(':clientId/phones/:phoneId')
  updatePhone(
    @Param('clientId') clientId: string,
    @Param('phoneId') phoneId: string,
    @Body() dto: UpdatePhoneDto,
  ): Promise<any> {
    return this.clientsService.updatePhone(clientId, phoneId, dto);
  }

  @Put(':clientId/phones/:phoneId/primary')
  setPrimary(
    @Param('clientId') clientId: string,
    @Param('phoneId') phoneId: string,
  ): Promise<any> {
    return this.clientsService.setPrimaryPhone(clientId, phoneId);
  }
}
