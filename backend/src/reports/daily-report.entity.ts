import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';

@Entity('daily_reports')
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column("text")
  completedYesterday: string;

  @Column("text")
  planForToday: string;

  @Column("text", { nullable: true })
  blockers: string;

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
