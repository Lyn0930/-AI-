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
import type {
  WorkerStatus,
  WorkerLevel,
} from '@shared/api.interface';
import { WorkersService } from './workers.service';

@Controller('api/workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('serviceCity') serviceCity?: string,
    @Query('serviceType') serviceType?: string,
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.workersService.list({
      page: page ? parseInt(page, 10) || 1 : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) || 10 : 10,
      serviceCity,
      serviceType,
      status: status as WorkerStatus | undefined,
      level: level as WorkerLevel | undefined,
      keyword,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.workersService.getById(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() body: Record<string, unknown>) {
    return this.workersService.create(body as any);
  }

  @NeedLogin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.workersService.update(id, body as any);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.workersService.remove(id);
    return { success: true };
  }

  @NeedLogin()
  @Post(':id/skills')
  async addSkill(
    @Param('id') workerId: string,
    @Body() body: { skillTag: string; proficiency?: string },
  ) {
    return this.workersService.addSkill(workerId, {
      skillTag: body.skillTag,
      proficiency: body.proficiency as 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined,
    });
  }

  @NeedLogin()
  @Delete(':id/skills/:skillId')
  async removeSkill(
    @Param('id') workerId: string,
    @Param('skillId') skillId: string,
  ) {
    await this.workersService.removeSkill(workerId, skillId);
    return { success: true };
  }

  @NeedLogin()
  @Post(':id/availability')
  async addAvailability(
    @Param('id') workerId: string,
    @Body() body: { date: string; timeSlot: string; status?: string },
  ) {
    return this.workersService.addAvailability(workerId, {
      date: body.date,
      timeSlot: body.timeSlot,
      status: body.status as 'available' | 'booked' | undefined,
    });
  }

  @NeedLogin()
  @Delete(':id/availability/:availabilityId')
  async removeAvailability(
    @Param('id') workerId: string,
    @Param('availabilityId') availabilityId: string,
  ) {
    await this.workersService.removeAvailability(workerId, availabilityId);
    return { success: true };
  }
}
