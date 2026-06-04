import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  secret?: string;
}
