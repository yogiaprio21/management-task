import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign', description: 'The name of the project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Redesigning the company website for better UX', description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Project deadline' })
  @IsOptional()
  deadline?: Date;

  @ApiPropertyOptional({ example: '7d61f9d8-d7b8-4f31-bc8f-30867bf524dd', description: 'Workspace that owns this project' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Website Redesign V2' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  deadline?: Date;

  @ApiPropertyOptional({ example: '7d61f9d8-d7b8-4f31-bc8f-30867bf524dd' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
