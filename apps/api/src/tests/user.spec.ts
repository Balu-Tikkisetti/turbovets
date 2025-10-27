import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConflictException } from '@nestjs/common';

describe('UserController (Guard + Service Tests)', () => {
  let controller: UserController;

  const mockUserService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    getProfileDetails: jest.fn(),
    getActiveUsers: jest.fn(),
    create: jest.fn(),
    updateUser: jest.fn(),
    remove: jest.fn(),
    getDepartments: jest.fn(),
    getUsersByDepartment: jest.fn(),
    getAssignableUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should check JwtAuthGuard is applied to profile endpoint', () => {
    const guards = Reflect.getMetadata('__guards__', UserController.prototype.getProfileDetails);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it('should return profile details successfully', async () => {
    const mockUser = { id: '1', username: 'test', email: 'test@test.com', role: 'Viewer', department: 'IT' };
    mockUserService.getProfileDetails.mockResolvedValue(mockUser);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await controller.getProfileDetails({ user: { userId: '1' } } as any);
    
    expect(result).toEqual(mockUser);
    expect(mockUserService.getProfileDetails).toHaveBeenCalledWith('1');
  });

  it('should throw ConflictException when creating duplicate user', async () => {
    mockUserService.create.mockRejectedValue(
      new ConflictException('Username already exists')
    );
    
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controller.create({ username: 'test', email: 'test@test.com', password: 'pass' } as any)
    ).rejects.toThrow(ConflictException);
  });
});

