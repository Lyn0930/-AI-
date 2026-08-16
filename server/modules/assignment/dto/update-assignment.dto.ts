import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  serviceCity?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  assigneeId?: string;
}
