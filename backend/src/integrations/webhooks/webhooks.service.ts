import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Webhook } from './webhook.entity';
import { Project } from '../../projects/project.entity';
import { User } from '../../users/user.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private httpService: HttpService,
    private auditService: AuditService,
  ) {}

  private async assertProjectManager(projectId: string, user: User): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) throw new NotFoundException('Project not found');

    const canManage = user.role === 'admin' || project.ownerId === user.id;
    if (!canManage) {
      throw new ForbiddenException('Only project owners or admins can manage webhooks');
    }

    return project;
  }

  private async assertWebhookAccess(id: string, user: User): Promise<Webhook> {
    const webhook = await this.webhooksRepository.findOne({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    await this.assertProjectManager(webhook.projectId, user);
    return webhook;
  }

  async findAll(projectId: string, user: User): Promise<Webhook[]> {
    await this.assertProjectManager(projectId, user);
    return this.webhooksRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: CreateWebhookDto, user: User): Promise<Webhook> {
    await this.assertProjectManager(data.projectId, user);
    const webhook = this.webhooksRepository.create({
      ...data,
      active: data.active ?? true,
    });
    const saved = await this.webhooksRepository.save(webhook);
    await this.auditService.log('create', 'Webhook', saved.id, user, {
      projectId: saved.projectId,
      events: saved.events,
    });
    return saved;
  }

  async update(id: string, data: UpdateWebhookDto, user: User): Promise<Webhook> {
    const webhook = await this.assertWebhookAccess(id, user);
    await this.webhooksRepository.update(webhook.id, data);
    await this.auditService.log('update', 'Webhook', webhook.id, user, data);
    return this.webhooksRepository.findOne({ where: { id } });
  }

  async remove(id: string, user: User): Promise<void> {
    const webhook = await this.assertWebhookAccess(id, user);
    await this.webhooksRepository.softDelete(webhook.id);
    await this.auditService.log('delete', 'Webhook', webhook.id, user);
  }

  async test(id: string, user: User) {
    const webhook = await this.assertWebhookAccess(id, user);
    return this.triggerWebhook(webhook, {
      event: 'webhook.test',
      title: 'TaskFlow webhook test',
      message: 'Your webhook is connected successfully.',
      createdAt: new Date().toISOString(),
    });
  }

  async dispatch(projectId: string, event: string, payload: Record<string, unknown>) {
    const webhooks = await this.webhooksRepository.find({
      where: { projectId, active: true },
    });

    await Promise.all(
      webhooks
        .filter((webhook) => webhook.events.includes(event))
        .map((webhook) => this.triggerWebhook(webhook, { event, ...payload })),
    );
  }

  async triggerWebhook(webhook: Webhook, payload: Record<string, unknown>) {
    const body = webhook.url.includes('discord.com/api/webhooks')
      ? {
          content: `**${payload.title || payload.event}**\n${payload.message || ''}`,
          embeds: [
            {
              title: String(payload.title || payload.event),
              description: String(payload.message || ''),
              timestamp: new Date().toISOString(),
            },
          ],
        }
      : payload;

    const rawBody = JSON.stringify(body);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (webhook.secret) {
      headers['X-TaskFlow-Signature'] = createHmac('sha256', webhook.secret)
        .update(rawBody)
        .digest('hex');
    }

    try {
      const response = await lastValueFrom(this.httpService.post(webhook.url, body, { headers, timeout: 8000 }));
      await this.webhooksRepository.update(webhook.id, {
        lastStatus: String(response.status),
        lastTriggeredAt: new Date(),
      });
      return { ok: true, status: response.status };
    } catch (error: any) {
      const status = error?.response?.status ? String(error.response.status) : 'failed';
      await this.webhooksRepository.update(webhook.id, {
        lastStatus: status,
        lastTriggeredAt: new Date(),
      });
      return { ok: false, status };
    }
  }
}
