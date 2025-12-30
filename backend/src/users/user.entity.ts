import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { Project } from '../projects/project.entity';
import { Notification } from '../notifications/notification.entity';
import { DailyReport } from '../reports/daily-report.entity';

import { BacklogItem } from '../backlog/backlog-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column()
  name: string;

  @Column({ default: 'user' }) // admin, user, manager
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];
  
  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => BacklogItem, (item) => item.assignee)
  backlogItems: BacklogItem[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => DailyReport, (report) => report.user)
  dailyReports: DailyReport[];
}
