import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>) {
    return this.notificationsRepository.save(data);
  }

  async findAllByUser(userId: string) {
    return this.notificationsRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
