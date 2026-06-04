import { IsEmail, IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import type { WorkspaceRole } from '../workspace-member.entity';

export class AddWorkspaceMemberDto {
  @ValidateIf((value) => !value.userId)
  @IsEmail()
  email?: string;

  @ValidateIf((value) => !value.email)
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIn(['admin', 'member', 'viewer'])
  role?: WorkspaceRole;
}
