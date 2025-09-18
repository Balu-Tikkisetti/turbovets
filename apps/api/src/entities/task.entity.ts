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
  import {TaskStatus} from 'libs/data/src/lib/enums/task-status.enum';
  import {TaskPriority} from 'libs/data/src/lib/enums/task-priority.enum';
  import {TaskCategory} from 'libs/data/src/lib/enums/task-category.enum';
  

  
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

  // Relates to the User entity for the creator
  @Column()
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  // Links as a JSON array
  @Column({ type: 'json', nullable: true })
  links: { url: string }[];

  // Media files as a JSON array
  @Column({ type: 'json', nullable: true })
  media: { name: string; url: string }[];

  // Related tasks as a JSON array of IDs
  @Column({ type: 'json', nullable: true })
  relatedTasks: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}