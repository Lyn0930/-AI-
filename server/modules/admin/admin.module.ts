import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AiConfigService } from './ai-config.service';
import { RequirementCollectionModule } from '../automation/requirement-collection.module';

@Module({
  imports: [RequirementCollectionModule],
  controllers: [AdminController],
  providers: [AdminService, AiConfigService],
  exports: [AiConfigService],
})
export class AdminModule {}
