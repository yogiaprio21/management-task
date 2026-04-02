import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
