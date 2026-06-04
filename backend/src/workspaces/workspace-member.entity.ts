import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Workspace } from './workspace.entity';
import { User } from '../users/user.entity';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.workspaceMemberships, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'member' })
  role: WorkspaceRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
