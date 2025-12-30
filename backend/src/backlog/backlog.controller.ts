import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BacklogService } from './backlog.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('backlog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('backlog')
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @Post()
  create(@Body() createBacklogDto: any, @CurrentUser() user: User) {
    return this.backlogService.create(createBacklogDto, user);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.backlogService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backlogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBacklogDto: any, @CurrentUser() user: User) {
    return this.backlogService.update(id, updateBacklogDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.backlogService.remove(id, user);
  }
}
