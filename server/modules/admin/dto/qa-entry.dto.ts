import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateQAEntryDto {
  @IsString()
  @MinLength(1)
  question!: string;

  @IsString()
  @MinLength(1)
  answer!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateQAEntryDto {
  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
