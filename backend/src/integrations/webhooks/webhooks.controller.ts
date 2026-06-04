import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/user.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll(@Query('projectId') projectId: string, @CurrentUser() user: User) {
    return this.webhooksService.findAll(projectId, user);
  }

  @Post()
  create(@Body() createWebhookDto: CreateWebhookDto, @CurrentUser() user: User) {
    return this.webhooksService.create(createWebhookDto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto, @CurrentUser() user: User) {
    return this.webhooksService.update(id, updateWebhookDto, user);
  }

  @Post(':id/test')
  test(@Param('id') id: string, @CurrentUser() user: User) {
    return this.webhooksService.test(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.webhooksService.remove(id, user);
  }
}
