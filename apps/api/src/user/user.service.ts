import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { RegisterUserDto, UserDto, Role } from '@turbovets/data';
import { AuditLog, AuditAction, AuditResource } from '../entities/audit-log.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async create(dto: RegisterUserDto): Promise<User> {
    const user = this.userRepo.create({
      ...dto,
      role: Role.Viewer,
    });
    return this.userRepo.save(user);
  }


  async remove(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async getProfileDetails(userId: string): Promise<UserDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    };
  }

  async updateUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
    await this.userRepo.update(userId, { isActive });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { 
      lastLoginAt: new Date(),
      isActive: true 
    });
  }

  async getActiveUsers(): Promise<User[]> {
    return await this.userRepo.find({ 
      where: { isActive: true },
      select: ['id', 'username', 'email', 'role', 'department', 'lastLoginAt', 'isActive']
    });
  }

  async updateUser(userId: string, updateData: { role?: string; department?: string | null }, performedByUserId?: string): Promise<UserDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const originalRole = user.role;
    const originalDepartment = user.department;

    const updatePayload: Partial<User> = {};
    if (updateData.role) {
      updatePayload.role = updateData.role as Role;
    }
    if (updateData.department !== undefined) {
      updatePayload.department = updateData.department;
    }
    await this.userRepo.update(userId, updatePayload);
    
    const updatedUser = await this.userRepo.findOne({ where: { id: userId } });
    if (!updatedUser) {
      throw new Error('Failed to fetch updated user');
    }

    const changes: string[] = [];
    if (originalRole !== updatedUser.role) {
      changes.push(`Role changed from "${originalRole}" to "${updatedUser.role}"`);
    }
    if (originalDepartment !== updatedUser.department) {
      const oldDept = originalDepartment || 'Unassigned';
      const newDept = updatedUser.department || 'Unassigned';
      changes.push(`Department changed from "${oldDept}" to "${newDept}"`);
    }

    if (changes.length > 0) {
      const auditLog = this.auditLogRepo.create({
        action: AuditAction.UPDATE,
        resource: AuditResource.USER,
        resourceId: userId,
        description: `User profile updated: ${changes.join(', ')}`,
        metadata: {
          originalValues: {
            role: originalRole,
            department: originalDepartment
          },
          newValues: {
            role: updatedUser.role,
            department: updatedUser.department
          },
          changes: changes
        },
        userId: performedByUserId || userId
      });

      await this.auditLogRepo.save(auditLog);
    }

    const userDto: UserDto = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department
    };

    return userDto;
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { refreshToken } });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null, expiresAt: Date | null): Promise<void> {
    await this.userRepo.update(userId, { 
      refreshToken, 
      refreshTokenExpiresAt: expiresAt 
    });
  }

  async updateLastActivity(userId: string): Promise<void> {
    await this.userRepo.update(userId, { 
      lastActivityAt: new Date() 
    });
  }

  async getDepartments(): Promise<string[]> {
    const departments = await this.departmentRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
    
    return departments.map(dept => dept.name);
  }

  async getUsersByDepartment(
    department: string, 
    roleFilter?: Role[], 
    sortBy: 'role' | 'name' = 'role'
  ): Promise<UserDto[]> {
    let query = this.userRepo
      .createQueryBuilder('user')
      .where('user.department = :department', { department })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (roleFilter && roleFilter.length > 0) {
      query = query.andWhere('user.role IN (:...roles)', { roles: roleFilter });
    }

    if (sortBy === 'role') {
      query = query
        .orderBy(`
          CASE 
            WHEN user.role = 'Owner' THEN 1
            WHEN user.role = 'Admin' THEN 2
            WHEN user.role = 'Viewer' THEN 3
            ELSE 4
          END
        `, 'ASC')
        .addOrderBy('user.username', 'ASC');
    } else {
      query = query.orderBy('user.username', 'ASC');
    }

    const users = await query.getMany();
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    }));
  }

  async getAssignableUsers(
    department?: string, 
    excludeCurrentUser = true, 
    currentUserId?: string
  ): Promise<UserDto[]> {
    let query = this.userRepo
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    if (department) {
      query = query.andWhere('user.department = :department', { department });
    }

    if (excludeCurrentUser && currentUserId) {
      query = query.andWhere('user.id != :currentUserId', { currentUserId });
    }

    query = query
      .orderBy(`
        CASE 
          WHEN user.role = 'Admin' THEN 1
          WHEN user.role = 'Viewer' THEN 2
          ELSE 3
        END
      `, 'ASC')
      .addOrderBy('user.username', 'ASC');

    const users = await query.getMany();
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    }));
  }
}
