import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('api/assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  async list() {
    return this.assignmentService.list();
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @NeedLogin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.assignmentService.remove(id);
    return { success: true };
  }
}
