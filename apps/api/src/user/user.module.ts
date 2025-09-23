import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { TaskModule } from '../task/task.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Department, AuditLog]), forwardRef(() => TaskModule)],
    
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
