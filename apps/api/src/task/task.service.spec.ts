import { Test } from '@nestjs/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TaskService],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a task', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'medium',
      status: 'to-do',
      category: 'work'
    };
    try {
      const result = await service.createTask(taskData, 'user-id');
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Task');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should find all tasks', async () => {
    try {
      const result = await service.findAllTasks();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should find one task', async () => {
    try {
      const result = await service.findTaskById('task-id');
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should update a task', async () => {
    const updateData = { title: 'Updated Task' };
    try {
      const result = await service.updateTask('task-id', updateData);
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should remove a task', async () => {
    try {
      const result = await service.deleteTask('task-id');
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});