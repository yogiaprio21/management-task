import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(@Body() createSprintDto: any, @CurrentUser() user: User) {
    return this.sprintsService.create(createSprintDto, user);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.sprintsService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSprintDto: any, @CurrentUser() user: User) {
    return this.sprintsService.update(id, updateSprintDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sprintsService.remove(id, user);
  }
}
