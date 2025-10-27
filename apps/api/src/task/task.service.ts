import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    BadRequestException,
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

    async createTask(createTaskDto: CreateTaskDto, creatorId: string, userRole?: Role, userDepartment?: string): Promise<Task> {
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

      // Department validation for Admin users
      if (userRole === Role.Admin && userDepartment && createTaskDto.department) {
        if (createTaskDto.department !== userDepartment) {
          throw new ForbiddenException('Admin users can only create tasks for their own department.');
        }
      }
      
      const task = this.taskRepository.create(taskData);
      return await this.taskRepository.save(task);
    }
  
    async findAllWorkTasksOrganization(
      page: number, 
      limit: number
    ): Promise<{ tasks: Task[], total: number, page: number, totalPages: number, hasNext: boolean }> {
      try {
        const query = this.taskRepository.createQueryBuilder('task')
          .leftJoinAndSelect('task.assignee', 'assignee')
          .leftJoinAndSelect('task.creator', 'creator')
          .where('task.category = :workCategory', { workCategory: TaskCategory.Work })
          .orderBy('task.createdAt', 'DESC');
    
        const [tasks, total] = await query
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
    
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
    
        return {
          tasks,
          total,
          page,
          totalPages,
          hasNext
        };
      } catch (error) {
        console.error('Error fetching work tasks:', error);
        throw new InternalServerErrorException(`Failed to fetch work tasks in organization: ${error.message}`);
      }
    }

    async findMyTasks(
      userId: string, 
      userRole: Role, 
      userDepartment: string | undefined,
      page: number,
      limit: number
    ): Promise<{ tasks: Task[], total: number, page: number, limit: number, totalPages: number }> {
      const query = this.taskRepository.createQueryBuilder('task')
        .leftJoinAndSelect('task.assignee', 'assignee')
        .leftJoinAndSelect('task.creator', 'creator')
        .orderBy('task.createdAt', 'DESC');
    
      if (userRole === Role.Owner) {
        // Owner can see all work tasks they created/assigned + their own personal tasks
        query.where(
          '(task.category = :workCategory AND task.creatorId = :userId) OR (task.category = :personalCategory AND task.creatorId = :userId)',
          {
            workCategory: TaskCategory.Work,
            personalCategory: TaskCategory.Personal,
            userId
          }
        );
      } else if (userRole === Role.Admin) {
        // Admin can see work tasks in their department they assigned + their own personal tasks
        if (userDepartment) {
          query.where(
            '(task.category = :workCategory AND task.department = :department AND task.assigneeId = :userId) OR (task.category = :personalCategory AND task.creatorId = :userId)',
            {
              workCategory: TaskCategory.Work,
              personalCategory: TaskCategory.Personal,
              department: userDepartment,
              userId
            }
          );
        } 
      } else if (userRole === Role.Viewer) {
        // Viewer can see tasks they created or are assigned to
        if (userDepartment) {
          query.where(
            '((task.assigneeId = :userId AND task.category = :workCategory AND task.department = :department) OR (task.creatorId = :userId))',
            { 
              userId,
              workCategory: TaskCategory.Work,
              department: userDepartment
            }
          );
        } else {
          // Viewer without department can only see tasks they created
          query.where(
            '(task.creatorId = :userId)',
            { userId }
          );
        }
      } else {
        // Unknown role - return empty array
        query.where('1 = 0');
      }
    
      // Get total count
      const total = await query.getCount();
    
      // Apply pagination
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);
    
      // Get paginated results
      const tasks = await query.getMany();
    
      return {
        tasks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    }


    
  
    async findTaskById(id: string, userId: string, userRole: Role): Promise<Task | undefined> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        return undefined;
      }
      
      // Apply same permission logic as findAllTasks
      if (userRole === Role.Owner) {
        // Owner can see all work tasks + their own personal tasks
        if (task.category === TaskCategory.Work || (task.category === TaskCategory.Personal && task.creatorId === userId)) {
          return task;
        }
      } else if (userRole === Role.Admin) {
        // Admin can see all work tasks + their own personal tasks
        if (task.category === TaskCategory.Work || (task.category === TaskCategory.Personal && task.creatorId === userId)) {
          return task;
        }
      } else if (userRole === Role.Viewer) {
        // Viewer can only see personal tasks they created + work tasks they created or are assigned to
        if ((task.category === TaskCategory.Personal && task.creatorId === userId) ||
            (task.category === TaskCategory.Work && (task.creatorId === userId || task.assigneeId === userId))) {
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
  
    async updateTask(
      id: string, 
      updateTaskDto: UpdateTaskDto, 
      userId: string, 
      userRole: Role, 
      userDepartment: string
    ): Promise<Task> {
      try {
        const task = await this.taskRepository.findOne({ where: { id } });
        
        if (!task) {
          throw new NotFoundException(`Task with ID ${id} not found.`);
        }
    
        let canEdit = false;
        
        if (userRole === Role.Owner) {
          // Owner can edit all work tasks + their own personal tasks
          canEdit = task.category === TaskCategory.Work || 
                    (task.category === TaskCategory.Personal && task.creatorId === userId);
        } else if (userRole === Role.Admin) {
          // Admin can edit all work tasks in their department + their own personal tasks
          canEdit = (task.category === TaskCategory.Work && task.department === userDepartment) || 
                    (task.category === TaskCategory.Personal && task.creatorId === userId);
        } else if (userRole === Role.Viewer) {
          // Viewer can only edit their own personal tasks
          canEdit = task.category === TaskCategory.Personal && task.creatorId === userId;
        }
        
        if (!canEdit) {
          throw new ForbiddenException('You do not have permission to update this task.');
        }
        
        const updatedTask = this.taskRepository.merge(task, updateTaskDto);
        return await this.taskRepository.save(updatedTask);
        
      } catch (error) {
        // Re-throw NestJS exceptions as-is
        if (error instanceof NotFoundException || error instanceof ForbiddenException) {
          throw error;
        }
        
        // Handle database errors
        if (error.code === '23505') { 
          throw new ConflictException('Task with this unique constraint already exists.');
        }
        
        if (error.code === '23503') { 
          throw new BadRequestException('Referenced resource does not exist.');
        }
        
        // Log unexpected errors
        console.error('Error updating task:', error);
        throw new InternalServerErrorException('Failed to update task. Please try again later.');
      }
    }
  
    async deleteTask(id: string, userId: string, userRole: Role): Promise<void> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task not found.`);
      }
    
      let canDelete = false;
    
      if (userRole === Role.Owner) {
        canDelete =
          task.category === TaskCategory.Work ||
          (task.category === TaskCategory.Personal && task.creatorId === userId);
      } else if (userRole === Role.Admin) {
        canDelete =
          (task.category === TaskCategory.Work && task.creatorId === userId) ||
          (task.category === TaskCategory.Personal && task.creatorId === userId);
      } else if (userRole === Role.Viewer) {
        canDelete =
          task.category === TaskCategory.Personal && task.creatorId === userId;
      }
    
      if (!canDelete) {
        throw new ForbiddenException(
          `You do not have permission to delete this task.`
        );
      }
    
      try {
        await this.taskRepository.remove(task);
      } catch (error) {
        throw new ConflictException(
          `Task could not be deleted. It may be linked to other records. ${error.message}`
        );
      }
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

    async assignTask(taskId: string, assigneeId: string, userId: string, userRole: Role): Promise<Task> {
      // Check if user has permission to assign tasks
      if (userRole !== Role.Owner && userRole !== Role.Admin) {
        throw new ForbiddenException('Only owners and admins can assign tasks.');
      }

      const task = await this.taskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      // Check if user can edit this task
      let canEdit = false;
      
      if (userRole === Role.Owner) {
        // Owner can assign all work tasks + their own personal tasks
        canEdit = task.category === TaskCategory.Work || (task.category === TaskCategory.Personal && task.creatorId === userId);
      } else if (userRole === Role.Admin) {
        // Admin can assign all work tasks + their own personal tasks
        canEdit = task.category === TaskCategory.Work || (task.category === TaskCategory.Personal && task.creatorId === userId);
      }
      
      if (!canEdit) {
        throw new ForbiddenException('You do not have permission to assign this task.');
      }

      task.assigneeId = assigneeId;
      task.updatedAt = new Date();

      return this.taskRepository.save(task);
    }

  }
  