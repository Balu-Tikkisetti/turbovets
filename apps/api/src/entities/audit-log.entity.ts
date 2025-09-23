import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
  APPROVE = 'approve',
  REJECT = 'reject',
  ARCHIVE = 'archive',
  RESTORE = 'restore'
}

export enum AuditResource {
  TASK = 'task',
  USER = 'user',
  AUTH = 'auth',
  SYSTEM = 'system',
  ANALYTICS = 'analytics',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  REPORT = 'report'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'enum', enum: AuditResource })
  resource: AuditResource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'enum', enum: AuditSeverity, default: AuditSeverity.LOW })
  severity: AuditSeverity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userRole: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'integer', default: 0 })
  duration: number; // in milliseconds

  @Column({ type: 'boolean', default: false })
  isSuccess: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
