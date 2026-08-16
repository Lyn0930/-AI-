import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import type { SmsSendResponse } from '@shared/api.interface';

@Controller('api/public/sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async send(@Body() dto: SendSmsDto): Promise<SmsSendResponse> {
    return this.smsService.sendCode(dto.phoneNumber);
  }
}
