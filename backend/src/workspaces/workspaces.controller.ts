import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAll(user);
  }

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @CurrentUser() user: User) {
    return this.workspacesService.create(createWorkspaceDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.findOne(id, user);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddWorkspaceMemberDto, @CurrentUser() user: User) {
    return this.workspacesService.addMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: User) {
    return this.workspacesService.removeMember(id, userId, user);
  }
}
