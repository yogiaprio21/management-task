import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn, OneToMany, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { Sprint } from '../sprints/sprint.entity';
import { BacklogItem } from '../backlog/backlog-item.entity';
import { User } from '../users/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  @Index()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.projects) 
  owner: User;

  @ManyToMany(() => User, (user) => user.memberProjects)
  @JoinTable({ name: 'project_members' })
  members: User[];

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => BacklogItem, (item) => item.project)
  backlogItems: BacklogItem[];

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
