import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateContactLogDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['wechat_add', 'wechat_message', 'phone_call'])
  contactType!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'success', 'failed'])
  status!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
