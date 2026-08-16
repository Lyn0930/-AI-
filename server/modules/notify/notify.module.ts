import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
