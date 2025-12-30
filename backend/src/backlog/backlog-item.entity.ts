import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

@Entity('backlog_items')
export class BacklogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'low' }) // low, medium, high
  priority: string;

  @Column({ default: 'todo' }) // todo, in_progress, done
  status: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.backlogItems)
  project: Project;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, (user) => user.backlogItems)
  assignee: User;

  @OneToMany(() => Task, (task) => task.backlogItem)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
