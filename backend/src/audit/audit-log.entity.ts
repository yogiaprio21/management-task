import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // 'create', 'update', 'delete'

  @Column()
  entityType: string; // 'Project', 'Task', etc.

  @Column()
  entityId: string;

  @Column("text", { nullable: true })
  details: string; // JSON string of changes

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
