import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from '../audit-log/audit-log.controller';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@turbovets/data';

describe('AuditLogController (Guard + Service Tests)', () => {
  let controller: AuditLogController;

  const mockAuditLogService = {
    findAll: jest.fn(),
    log: jest.fn(),
    findByResource: jest.fn(),
    getCriticalActivities: jest.fn(),
  };

  const mockUser = {
    userId: '1',
    role: Role.Owner,
    department: 'IT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuditLogController>(AuditLogController);
  });

  it('should check JwtAuthGuard and RolesGuard are applied', () => {
    const guards = Reflect.getMetadata('__guards__', AuditLogController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(RolesGuard);
  });

  it('should return paginated audit logs for Owner', async () => {
    const mockLogs = { logs: [{ id: '1', action: 'CREATE', resource: 'TASK' }], total: 1 };
    mockAuditLogService.findAll.mockResolvedValue(mockLogs);
    
    const result = await controller.findAll(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { user: mockUser } as any,
      '1',
      '50'
    );
    
    expect(result).toEqual(mockLogs);
    expect(mockAuditLogService.findAll).toHaveBeenCalledWith('1', Role.Owner, 'IT', 1, 50);
  });

  it('should filter audit logs by role correctly', async () => {
    const adminUser = { userId: '2', role: Role.Admin, department: 'HR' };
    mockAuditLogService.findAll.mockResolvedValue({ logs: [], total: 0 });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await controller.findAll({ user: adminUser } as any, '1', '50');
    
    expect(mockAuditLogService.findAll).toHaveBeenCalledWith('2', Role.Admin, 'HR', 1, 50);
  });
});

