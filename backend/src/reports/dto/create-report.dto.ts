import { IsIn, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(3)
  content: string;

  @IsIn(['daily', 'weekly'])
  type: 'daily' | 'weekly';

  @IsUUID()
  projectId: string;
}
