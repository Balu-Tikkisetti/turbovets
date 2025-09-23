import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@turbovets/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  beforeEach(() => {
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            userId: 'user-123',
            role: Role.Viewer,
            department: 'Engineering',
          },
        }),
      }),
    } as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should return true if user role is allowed', () => {
      const allowedRoles = [Role.Viewer, Role.Admin];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if user is Owner (highest role)', () => {
      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: 'user-123',
              role: Role.Owner,
              department: 'Engineering',
            },
          }),
        }),
      } as ExecutionContext;

      const allowedRoles = [Role.Viewer];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false if user role is not allowed', () => {
      const allowedRoles = [Role.Admin, Role.Owner];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false if user is not authenticated', () => {
      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
      } as ExecutionContext;

      const allowedRoles = [Role.Viewer];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle Admin role correctly', () => {
      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: 'user-123',
              role: Role.Admin,
              department: 'Engineering',
            },
          }),
        }),
      } as ExecutionContext;

      const allowedRoles = [Role.Viewer, Role.Admin];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle Viewer role correctly', () => {
      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: 'user-123',
              role: Role.Viewer,
              department: 'Engineering',
            },
          }),
        }),
      } as ExecutionContext;

      const allowedRoles = [Role.Viewer];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);
      
      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
