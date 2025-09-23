import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import {TaskStatus,TaskPriority,TaskCategory } from '@turbovets/data';

@Entity('tasks')
@Index(['category', 'creatorId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.Medium })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, nullable: true })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskCategory })
  category: TaskCategory;

  @Column({ length: 255, nullable: true })
  department: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ length: 5, nullable: true })
  startTime: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ length: 5, nullable: true })
  dueTime: string;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, (user) => user.assignedTasks)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'creatorId' })
  creator: User;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}