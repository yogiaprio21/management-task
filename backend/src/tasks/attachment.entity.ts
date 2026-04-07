import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from './task.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column()
  mimetype: string;

  @Column()
  @Index()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
