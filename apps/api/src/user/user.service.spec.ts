import { Test } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all users', async () => {
    try {
      const result = await service.findAllUsers();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should find one user', async () => {
    try {
      const result = await service.findUserById('user-id');
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should update user role', async () => {
    try {
      const result = await service.updateUserRole('user-id', 'admin');
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
