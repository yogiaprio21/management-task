import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: User) {
    return this.reportsService.create(createReportDto, user);
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @CurrentUser() user: User) {
    return this.reportsService.findAllByProject(projectId, user);
  }

  @Get('analytics')
  getAnalytics(@Query('projectId') projectId: string, @CurrentUser() user: User) {
    return this.reportsService.getAnalytics(projectId, user);
  }
}
