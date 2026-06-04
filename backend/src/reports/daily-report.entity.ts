import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';

@Entity('daily_reports')
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ default: 'daily' })
  type: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.dailyReports)
  user: User;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  @CreateDateColumn()
  createdAt: Date;
}
