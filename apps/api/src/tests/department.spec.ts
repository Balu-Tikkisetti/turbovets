import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from '../department/department.controller';
import { DepartmentService } from '../department/department.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DepartmentController (Guard + Service Tests)', () => {
  let controller: DepartmentController;

  const mockDepartmentService = {
    createDepartment: jest.fn(),
    findAllDepartments: jest.fn(),
    findDepartmentById: jest.fn(),
    updateDepartment: jest.fn(),
    deleteDepartment: jest.fn(),
    getDepartmentStats: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  it('should check JwtAuthGuard and RolesGuard are applied', () => {
    const guards = Reflect.getMetadata('__guards__', DepartmentController);
    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThan(0);
  });

  it('should throw ConflictException when creating duplicate department', async () => {
    mockDepartmentService.createDepartment.mockRejectedValue(
      new ConflictException('A department with this name already exists.')
    );
    
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controller.create({ name: 'IT', color: '#000' } as any, { user: { userId: '1' } } as any)
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException when department not found', async () => {
    mockDepartmentService.findDepartmentById.mockRejectedValue(
      new NotFoundException('Department not found.')
    );
    
    await expect(
      controller.findOne('invalid-id')
    ).rejects.toThrow(NotFoundException);
  });
});

