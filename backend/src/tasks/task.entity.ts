import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Sprint } from '../sprints/sprint.entity';
import { BacklogItem } from '../backlog/backlog-item.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'todo' }) // todo, in_progress, review, done
  @Index()
  status: string;

  @Column({ default: 'medium' })
  @Index()
  priority: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  @Index()
  creatorId: string;

  @ManyToOne(() => User)
  creator: User;

  @Column({ nullable: true })
  @Index()
  assigneeId: string;

  @ManyToOne(() => User, (user) => user.tasks)
  assignee: User;

  @Column({ nullable: true })
  @Index()
  sprintId: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks)
  sprint: Sprint;

  @Column({ nullable: true })
  @Index()
  backlogItemId: string;

  @ManyToOne(() => BacklogItem, (item) => item.tasks)
  backlogItem: BacklogItem;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
