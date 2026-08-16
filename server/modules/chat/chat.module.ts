import { Module, forwardRef } from '@nestjs/common';
import { ChatController, CustomerChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatEventBus } from './chat-event-bus.service';
import { ReplyLearningService } from './reply-learning.service';
import { NotifyModule } from '../notify/notify.module';
import { AdminModule } from '../admin/admin.module';
import { RoutingModule } from '../routing/routing.module';
import { BitableSyncModule } from '../bitable-sync/bitable-sync.module';
import { RequirementCollectionModule } from '../automation/requirement-collection.module';
import { LeadsModule } from '../leads/leads.module';
import { SalaryConfigModule } from '../salary-config/salary-config.module';

@Module({
  imports: [
    NotifyModule,
    AdminModule,
    forwardRef(() => RoutingModule),
    BitableSyncModule,
    RequirementCollectionModule,
    forwardRef(() => LeadsModule),
    SalaryConfigModule,
  ],
  controllers: [ChatController, CustomerChatController],
  providers: [ChatService, ChatEventBus, ReplyLearningService],
  exports: [ChatService],
})
export class ChatModule {}
