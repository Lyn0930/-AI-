import { Module } from '@nestjs/common';
import { MiaodaConnectionsModule } from '@lark-apaas/miaoda-connections-sdk';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [MiaodaConnectionsModule.forRoot()],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
