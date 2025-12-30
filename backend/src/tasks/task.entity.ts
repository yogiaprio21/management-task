import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Sprint } from '../sprints/sprint.entity';
import { BacklogItem } from '../backlog/backlog-item.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'todo' }) // todo, in_progress, review, done
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToOne(() => User)
  creator: User;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, (user) => user.tasks)
  assignee: User;

  @Column({ nullable: true })
  sprintId: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks)
  sprint: Sprint;

  @Column({ nullable: true })
  backlogItemId: string;

  @ManyToOne(() => BacklogItem, (item) => item.tasks)
  backlogItem: BacklogItem;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
