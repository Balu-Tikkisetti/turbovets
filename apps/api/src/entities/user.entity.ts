import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { Role } from '../../../../libs/data/src/lib/enums/role.enum';
import { Task } from './task.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.Viewer })
  role: Role;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // A user can be an assignee for multiple tasks
  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Task[];

  // A user can be the creator of multiple tasks
  @OneToMany(() => Task, (task) => task.creator)
  createdTasks: Task[];
}