import { Module } from '@nestjs/common';
import { RequirementCollectionService } from './requirement-collection.service';

@Module({
  providers: [RequirementCollectionService],
  exports: [RequirementCollectionService],
})
export class RequirementCollectionModule {}
