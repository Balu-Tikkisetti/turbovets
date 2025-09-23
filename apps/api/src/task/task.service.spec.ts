import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { Role, TaskStatus, TaskPriority, TaskCategory } from '@turbovets/data';

describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.Medium,
        status: TaskStatus.ToDo,
        category: TaskCategory.Work,
        dueDate: undefined,
        recurring: false,
      };
      const creatorId = 'user-123';
      const expectedTask = { id: 'task-123', ...createTaskDto, creatorId };

      mockRepository.create.mockReturnValue(expectedTask);
      mockRepository.save.mockResolvedValue(expectedTask);

      const result = await service.createTask(createTaskDto, creatorId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        status: createTaskDto.status,
        category: createTaskDto.category,
        department: null,
        startDate: null,
        startTime: null,
        dueDate: null,
        dueTime: null,
        recurring: false,
        assigneeId: null,
        creatorId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTask);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks for any authenticated user', async () => {
      const userId = 'user-123';
      const userRole = Role.Viewer;
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', creatorId: 'user-1' },
        { id: 'task-2', title: 'Task 2', creatorId: 'user-2' },
      ];

      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAllTasks(userId, userRole);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findTaskById', () => {
    it('should return task if user is creator', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;
      const mockTask = { id: taskId, title: 'Test Task', creatorId: userId };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findTaskById(taskId, userId, userRole);

      expect(result).toEqual(mockTask);
    });

    it('should return task if user is Admin', async () => {
      const taskId = 'task-123';
      const userId = 'user-456';
      const userRole = Role.Admin;
      const mockTask = { id: taskId, title: 'Test Task', creatorId: 'user-123' };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findTaskById(taskId, userId, userRole);

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if user is not creator and not Admin/Owner', async () => {
      const taskId = 'task-123';
      const userId = 'user-456';
      const userRole = Role.Viewer;
      const mockTask = { id: taskId, title: 'Test Task', creatorId: 'user-123' };

      mockRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.findTaskById(taskId, userId, userRole))
        .rejects.toThrow(ForbiddenException);
    });

    it('should return undefined if task not found', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;

      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findTaskById(taskId, userId, userRole);

      expect(result).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update task if user is creator', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;
      const updateDto = { title: 'Updated Task' };
      const existingTask = { id: taskId, title: 'Original Task', creatorId: userId };
      const updatedTask = { ...existingTask, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.merge.mockReturnValue(updatedTask);
      mockRepository.save.mockResolvedValue(updatedTask);

      const result = await service.updateTask(taskId, updateDto, userId, userRole);

      expect(mockRepository.merge).toHaveBeenCalledWith(existingTask, updateDto);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;
      const updateDto = { title: 'Updated Task' };

      mockRepository.findOne.mockResolvedValue(undefined);

      await expect(service.updateTask(taskId, updateDto, userId, userRole))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot edit task', async () => {
      const taskId = 'task-123';
      const userId = 'user-456';
      const userRole = Role.Viewer;
      const updateDto = { title: 'Updated Task' };
      const existingTask = { id: taskId, title: 'Original Task', creatorId: 'user-123' };

      mockRepository.findOne.mockResolvedValue(existingTask);

      await expect(service.updateTask(taskId, updateDto, userId, userRole))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTask', () => {
    it('should delete task if user is creator', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;
      const mockTask = { id: taskId, title: 'Test Task', creatorId: userId };

      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.deleteTask(taskId, userId, userRole);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      const taskId = 'task-123';
      const userId = 'user-123';
      const userRole = Role.Viewer;

      mockRepository.findOne.mockResolvedValue(undefined);

      await expect(service.deleteTask(taskId, userId, userRole))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkDeleteTasks', () => {
    it('should delete multiple tasks if user has permission', async () => {
      const taskIds = ['task-1', 'task-2'];
      const userId = 'user-123';
      const userRole = Role.Owner;
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', creatorId: 'user-123' },
        { id: 'task-2', title: 'Task 2', creatorId: 'user-123' },
      ];

      mockRepository.find.mockResolvedValue([]); // All tasks check
      mockRepository.findBy.mockResolvedValue(mockTasks);
      mockRepository.remove.mockResolvedValue(mockTasks);

      await service.bulkDeleteTasks(taskIds, userId, userRole);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTasks);
    });

    it('should throw NotFoundException if some tasks not found', async () => {
      const taskIds = ['task-1', 'task-2'];
      const userId = 'user-123';
      const userRole = Role.Owner;
      const mockTasks = [{ id: 'task-1', title: 'Task 1', creatorId: 'user-123' }];

      mockRepository.find.mockResolvedValue([]);
      mockRepository.findBy.mockResolvedValue(mockTasks);

      await expect(service.bulkDeleteTasks(taskIds, userId, userRole))
        .rejects.toThrow(NotFoundException);
    });
  });
});
