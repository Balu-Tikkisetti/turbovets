import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>
  ) {}

  async createDepartment(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    try {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: createDepartmentDto.name }
      });

      if (existingDepartment) {
        throw new ConflictException('A department with this name already exists. Please choose a different name.');
      }

      const department = this.departmentRepository.create({
        ...createDepartmentDto,
        color: createDepartmentDto.color || '#3B82F6'
      });

      return await this.departmentRepository.save(department);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Failed to create department. Please try again.');
    }
  }

  async findAllDepartments(): Promise<Department[]> {
    try {
      // Retrieve all departments ordered by name
      return await this.departmentRepository.find({
        order: { name: 'ASC' }
      });
    } catch {
      throw new Error('Failed to retrieve departments. Please try again.');
    }
  }

  async findDepartmentById(id: string): Promise<Department> {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!department) {
        throw new NotFoundException('Department not found. It may have been deleted or the ID is incorrect.');
      }

      // Count users assigned to this department
      const memberCount = await this.departmentRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('users', 'user')
        .where('user.department = :departmentName', { departmentName: department.name })
        .getRawOne();
      
      // Count tasks assigned to this department
      const taskCount = await this.departmentRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('tasks', 'task')
        .where('task.department = :departmentName', { departmentName: department.name })
        .getRawOne();

      department.memberCount = parseInt(memberCount.count) || 0;
      department.taskCount = parseInt(taskCount.count) || 0;

      return department;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to retrieve department details. Please try again.');
    }
  }

  async updateDepartment(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    try {
      const department = await this.findDepartmentById(id);

      if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
        const existingDepartment = await this.departmentRepository.findOne({
          where: { name: updateDepartmentDto.name }
        });

        if (existingDepartment) {
          throw new ConflictException('A department with this name already exists. Please choose a different name.');
        }
      }

      Object.assign(department, updateDepartmentDto);
      return await this.departmentRepository.save(department);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update department. Please try again.');
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      const department = await this.findDepartmentById(id);
      
      if (department.memberCount > 0) {
        throw new ConflictException('Cannot delete department. It has active members. Please reassign all members to other departments first.');
      }

      if (department.taskCount > 0) {
        throw new ConflictException('Cannot delete department. It has active tasks. Please reassign all tasks to other departments first.');
      }

      await this.departmentRepository.remove(department);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete department. Please try again.');
    }
  }

  async getDepartmentStats(id: string): Promise<{ id: string; name: string; taskCount: number; memberCount: number; activeTasks: number; completedTasks: number; createdAt: Date; updatedAt: Date }> {
    try {
      // Get comprehensive statistics for a department
      const department = await this.findDepartmentById(id);
      
      // Count active (non-completed) tasks
      const activeTasks = await this.departmentRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('tasks', 'task')
        .where('task.department = :departmentName', { departmentName: department.name })
        .andWhere('task.status != :status', { status: 'completed' })
        .getRawOne();
      
      // Count completed tasks
      const completedTasks = await this.departmentRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('tasks', 'task')
        .where('task.department = :departmentName', { departmentName: department.name })
        .andWhere('task.status = :status', { status: 'completed' })
        .getRawOne();
      
      return {
        id: department.id,
        name: department.name,
        memberCount: department.memberCount,
        taskCount: department.taskCount,
        activeTasks: parseInt(activeTasks.count) || 0,
        completedTasks: parseInt(completedTasks.count) || 0,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to retrieve department statistics. Please try again.');
    }
  }

  async updateDepartmentCounts(): Promise<void> {
    try {
      // Update member and task counts for all departments
      const departments = await this.departmentRepository.find();

      for (const department of departments) {
        // Count users assigned to this department
        const memberCount = await this.departmentRepository.manager
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('users', 'user')
          .where('user.department = :departmentName', { departmentName: department.name })
          .getRawOne();
        
        // Count tasks assigned to this department
        const taskCount = await this.departmentRepository.manager
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('tasks', 'task')
          .where('task.department = :departmentName', { departmentName: department.name })
          .getRawOne();

        // Update department with current counts
        department.memberCount = parseInt(memberCount.count) || 0;
        department.taskCount = parseInt(taskCount.count) || 0;
        await this.departmentRepository.save(department);
      }
    } catch {
      throw new Error('Failed to update department counts. Please try again.');
    }
  }
}
