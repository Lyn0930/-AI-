import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { ContactType, ContactStatus } from '@shared/api.interface';
import { ContactService } from './contact.service';
import { CreateContactLogDto } from './dto/create-contact-log.dto';

/**
 * 线索联系记录接口（路径前缀复用 api/leads）
 */
@Controller('api/leads')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get(':id/contact-logs')
  async listByLeadId(@Param('id') id: string) {
    return this.contactService.listByLeadId(id);
  }

  @NeedLogin()
  @Post(':id/contact-logs')
  async create(
    @Param('id') id: string,
    @Body() dto: CreateContactLogDto,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.contactService.create(
      id,
      {
        contactType: dto.contactType as ContactType,
        status: dto.status as ContactStatus,
        notes: dto.notes,
      },
      userId,
    );
  }
}
