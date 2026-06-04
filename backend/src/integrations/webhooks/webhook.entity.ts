import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column('simple-array', { default: '' })
  events: string[];

  @Column({ default: true })
  active: boolean;

  @Column()
  @Index()
  projectId: string;

  @Column({ nullable: true })
  secret?: string;

  @Column({ nullable: true })
  lastStatus?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
