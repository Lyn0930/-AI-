import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  serviceCity: string;

  @IsString()
  @IsNotEmpty()
  assigneeId: string;
}
