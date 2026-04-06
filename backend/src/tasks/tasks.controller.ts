import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: any, @CurrentUser() user: User) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('sprintId') sprintId: string) {
    return this.tasksService.findAll(user, sprintId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: any, @CurrentUser() user: User) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body('content') content: string, @CurrentUser() user: User) {
    return this.tasksService.addComment(id, content, user);
  }

  @Post(':id/attachments')
  addAttachment(@Param('id') id: string, @Body() attachmentData: any, @CurrentUser() user: User) {
    return this.tasksService.addAttachment(id, attachmentData, user);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.getActivityHistory(id, user);
  }
}
