import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

@Column({ type: 'timestamp', nullable: true })
lastLoginAt: Date;

@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
}