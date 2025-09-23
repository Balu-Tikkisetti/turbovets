import {
    Injectable,
    ForbiddenException,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, In } from 'typeorm';
  import { CreateTaskDto, UpdateTaskDto, Role, TaskStatus, TaskPriority, TaskCategory } from '@turbovets/data';
  import { Task } from '../entities/task.entity';
  
  
  @Injectable()
  export class TaskService {
    constructor(
      @InjectRepository(Task)
      private readonly taskRepository: Repository<Task>
    ) {}

    async createTask(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
      // Map DTO to task entity with default values
      const taskData = {
        title: createTaskDto.title,
        description: createTaskDto.description || '',
        priority: createTaskDto.priority || TaskPriority.Medium,
        status: createTaskDto.status || TaskStatus.ToDo,
        category: createTaskDto.category || TaskCategory.Personal,
        department: createTaskDto.department || null,
        startDate: createTaskDto.startDate ? new Date(createTaskDto.startDate) : null,
        startTime: createTaskDto.startTime || null,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        dueTime: createTaskDto.dueTime || null,
        recurring: createTaskDto.recurring || false,
        assigneeId: createTaskDto.assigneeId || null,
        creatorId: creatorId
      };
      
      const task = this.taskRepository.create(taskData);
      return await this.taskRepository.save(task);
    }
  
  async findAllTasks(userId: string, userRole: Role): Promise<Task[]> {
    // Build query with user role-based permissions
    let query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .orderBy('task.createdAt', 'DESC');

    if (userRole === Role.Owner) {
      // Owner can see all work tasks + their own personal tasks
      query = query.where('task.category = :workCategory', { workCategory: 'work' })
        .orWhere('(task.category = :personalCategory AND task.creatorId = :userId)', { 
          personalCategory: 'personal', 
          userId 
        });
    } else if (userRole === Role.Admin) {
      // Admin can see all work tasks + their own personal tasks
      query = query.where('task.category = :workCategory', { workCategory: 'work' })
        .orWhere('(task.category = :personalCategory AND task.creatorId = :userId)', { 
          personalCategory: 'personal', 
          userId 
        });
    } else if (userRole === Role.Viewer) {
      // Viewer can only see personal tasks they created + work tasks they created or are assigned to
      query = query.where('(task.category = :personalCategory AND task.creatorId = :userId)', { 
        personalCategory: 'personal', 
        userId 
      })
      .orWhere('(task.category = :workCategory AND (task.creatorId = :userId OR task.assigneeId = :userId))', { 
        workCategory: 'work', 
        userId 
      });
    }

    return await query.getMany();
  }
  
    async findTaskById(id: string, userId: string, userRole: Role): Promise<Task | undefined> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        return undefined;
      }
      
      // Apply same permission logic as findAllTasks
      if (userRole === Role.Owner) {
        // Owner can see all work tasks + their own personal tasks
        if (task.category === 'work' || (task.category === 'personal' && task.creatorId === userId)) {
          return task;
        }
      } else if (userRole === Role.Admin) {
        // Admin can see all work tasks + their own personal tasks
        if (task.category === 'work' || (task.category === 'personal' && task.creatorId === userId)) {
          return task;
        }
      } else if (userRole === Role.Viewer) {
        // Viewer can only see personal tasks they created + work tasks they created or are assigned to
        if ((task.category === 'personal' && task.creatorId === userId) ||
            (task.category === 'work' && (task.creatorId === userId || task.assigneeId === userId))) {
          return task;
        }
      }
      
      throw new ForbiddenException('You do not have permission to view this task.');
    }

    async getTaskForAudit(id: string): Promise<Task> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found.`);
      }
      return task;
    }
  
    async updateTask(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: Role): Promise<Task> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found.`);
      }
  
      let canEdit = false;
      
      if (userRole === Role.Owner) {
        // Owner can edit all work tasks + their own personal tasks
        canEdit = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
      } else if (userRole === Role.Admin) {
        // Admin can edit all work tasks + their own personal tasks
        canEdit = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
      } else if (userRole === Role.Viewer) {
        // Viewer can only edit their own personal tasks
        canEdit = task.category === 'personal' && task.creatorId === userId;
      }
      
      if (!canEdit) {
        throw new ForbiddenException('You do not have permission to update this task.');
      }
      
      const updatedTask = this.taskRepository.merge(task, updateTaskDto);
      return this.taskRepository.save(updatedTask);
    }
  
    async deleteTask(id: string, userId: string, userRole: Role): Promise<void> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found.`);
      }

      let canDelete = false;
      
      if (userRole === Role.Owner) {
        // Owner can delete all work tasks + their own personal tasks
        canDelete = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
      } else if (userRole === Role.Admin) {
        // Admin can delete all work tasks + their own personal tasks
        canDelete = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
      } else if (userRole === Role.Viewer) {
        // Viewer can only delete their own personal tasks
        canDelete = task.category === 'personal' && task.creatorId === userId;
      }
      
      if (!canDelete) {
        throw new ForbiddenException('You do not have permission to delete this task.');
      }
      
      await this.taskRepository.remove(task);
    }

    async bulkDeleteTasks(taskIds: string[], userId: string, userRole: Role): Promise<void> {
      // Find all tasks to be deleted
      const tasks = await this.taskRepository.findBy({ id: In(taskIds) });
      
      if (tasks.length !== taskIds.length) {
        throw new NotFoundException('One or more tasks not found.');
      }

      // Check permissions for all tasks
      for (const task of tasks) {
        let canDelete = false;
        
        if (userRole === Role.Owner) {
          // Owner can delete all work tasks + their own personal tasks
          canDelete = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
        } else if (userRole === Role.Admin) {
          // Admin can delete all work tasks + their own personal tasks
          canDelete = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
        } else if (userRole === Role.Viewer) {
          // Viewer can only delete their own personal tasks
          canDelete = task.category === 'personal' && task.creatorId === userId;
        }
        
        if (!canDelete) {
          throw new ForbiddenException(`You do not have permission to delete task "${task.title}".`);
        }
      }

      // Delete all tasks
      await this.taskRepository.remove(tasks);
    }

    async bulkUpdateTaskStatus(taskIds: string[], status: TaskStatus, userId: string, userRole: Role): Promise<Task[]> {
      const tasks = await this.taskRepository.findBy({ id: In(taskIds) });
      
      if (tasks.length !== taskIds.length) {
        throw new NotFoundException('One or more tasks not found.');
      }

      for (const task of tasks) {
        let canUpdate = false;
        
        if (userRole === Role.Owner) {
          // Owner can update all work tasks + their own personal tasks
          canUpdate = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
        } else if (userRole === Role.Admin) {
          // Admin can update all work tasks + their own personal tasks
          canUpdate = task.category === 'work' || (task.category === 'personal' && task.creatorId === userId);
        } else if (userRole === Role.Viewer) {
          // Viewer can only update their own personal tasks
          canUpdate = task.category === 'personal' && task.creatorId === userId;
        }
        
        if (!canUpdate) {
          throw new ForbiddenException(`You do not have permission to update task "${task.title}".`);
        }
      }

      const updatedTasks = tasks.map(task => {
        task.status = status;
        task.updatedAt = new Date();
        return task;
      });

      return this.taskRepository.save(updatedTasks);
    }

    async moveTaskToDepartment(taskId: string, newDepartment: string, userId: string, userRole: Role): Promise<Task> {
      if (userRole !== Role.Owner) {
        throw new ForbiddenException('Only owners can move tasks between departments.');
      }

      const task = await this.taskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      task.department = newDepartment;
      task.updatedAt = new Date();

      return this.taskRepository.save(task);
    }
  }
  