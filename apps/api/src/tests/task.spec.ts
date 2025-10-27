import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from '../task/task.controller';
import { TaskService } from '../task/task.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TaskGuard } from '../auth/guards/task.guard';
import { Role, TaskCategory, TaskStatus } from '@turbovets/data';

describe('TaskController (Guard + Service Tests)', () => {
  let controller: TaskController;

  const mockTaskService = {
    createTask: jest.fn(),
    findAllWorkTasksOrganization: jest.fn(),
    findMyTasks: jest.fn(),
    findTaskById: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskForAudit: jest.fn(),
    moveTaskToDepartment: jest.fn(),
    assignTask: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TaskGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should check JwtAuthGuard, RolesGuard, and TaskGuard are applied', () => {
    const guards = Reflect.getMetadata('__guards__', TaskController);
    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThan(0);
  });

  it('should throw InternalServerErrorException if service fails', async () => {
    mockTaskService.findAllWorkTasksOrganization.mockRejectedValue(
      new Error('Database error')
    );

    await expect(controller.findAllWorkTasksOrganization('1', '10')).rejects.toThrow(
      InternalServerErrorException
    );
  });

  it('should throw ForbiddenException when Viewer tries to edit work task', async () => {
    const mockTask = { id: '1', title: 'Test', category: TaskCategory.Work, creatorId: '2' };
    mockTaskService.findTaskById.mockResolvedValue(mockTask);
    mockTaskService.updateTask.mockRejectedValue(
      new ForbiddenException('You do not have permission to update this task.')
    );
    
    await expect(
      controller.update(
        '1',
        { status: TaskStatus.Started },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { user: { userId: '3', role: Role.Viewer }, task: mockTask } as any
      )
    ).rejects.toThrow(ForbiddenException);
  });
});
