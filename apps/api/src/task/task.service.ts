import {
    Injectable,
    ForbiddenException,
    NotFoundException,
  } from '@nestjs/common';
  import { TaskRepository } from './task.repository';
  import { CreateTaskDto } from '@libs/data/src/lib/dto/create-task.dto';
  import { UpdateTaskDto } from '@libs/data/src/lib/dto/update-task.dto';
  import { Task } from './task.entity';
  import { Role } from '@libs/data/src/lib/enums/role.enum';
  
  @Injectable()
  export class TaskService {
    constructor(private readonly taskRepository: TaskRepository) {}
  
    async createTask(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
      const task = this.taskRepository.create({
        ...createTaskDto,
        creatorId,
      });
      return this.taskRepository.save(task);
    }
  
    async findAllTasks(userId: string, userRole: Role): Promise<Task[]> {
      // Admins and Owners can see all tasks. Viewers can only see their own.
      if (userRole === Role.Admin || userRole === Role.Owner) {
        return this.taskRepository.find();
      }
      return this.taskRepository.find({ where: { creatorId: userId } });
    }
  
    async findTaskById(id: string, userId: string, userRole: Role): Promise<Task | undefined> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        return undefined;
      }
      // Check if the user is the creator or has a higher-level role
      if (task.creatorId !== userId && userRole !== Role.Admin && userRole !== Role.Owner) {
        throw new ForbiddenException('You do not have permission to view this task.');
      }
      return task;
    }
  
    async updateTask(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: Role): Promise<Task> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found.`);
      }
  
      // Check if the user is the creator or has the Admin/Owner role
      const canEdit = task.creatorId === userId || userRole === Role.Admin || userRole === Role.Owner;
      if (!canEdit) {
        throw new ForbiddenException('You do not have permission to update this task.');
      }
      
      // Merge the new data with the existing task and save
      const updatedTask = this.taskRepository.merge(task, updateTaskDto);
      return this.taskRepository.save(updatedTask);
    }
  
    async deleteTask(id: string, userId: string, userRole: Role): Promise<void> {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found.`);
      }
  
      // Check if the user is the creator or has the Admin/Owner role
      const canDelete = task.creatorId === userId || userRole === Role.Admin || userRole === Role.Owner;
      if (!canDelete) {
        throw new ForbiddenException('You do not have permission to delete this task.');
      }
      
      await this.taskRepository.remove(task);
    }
  }
  