import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { SalaryConfigService } from './salary-config.service';
import { CreateSalaryConfigDto } from './dto/create-salary-config.dto';
import { UpdateSalaryConfigDto } from './dto/update-salary-config.dto';

@Controller('api/salary-config')
export class SalaryConfigController {
  constructor(private readonly salaryConfigService: SalaryConfigService) {}

  /** 列表（全量或按 serviceType 过滤） */
  @Get()
  async list(@Query('serviceType') serviceType?: string) {
    if (serviceType) {
      return this.salaryConfigService.listByServiceType(serviceType);
    }
    return this.salaryConfigService.list();
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateSalaryConfigDto) {
    return this.salaryConfigService.create(dto);
  }

  @NeedLogin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSalaryConfigDto) {
    return this.salaryConfigService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.salaryConfigService.remove(id);
    return { success: true };
  }
}
