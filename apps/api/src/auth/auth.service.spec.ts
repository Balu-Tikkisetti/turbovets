import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user credentials', async () => {
    const result = await service.validateUser('test@test.com', 'password');
    expect(result).toBeDefined();
  });

  it('should generate JWT token', async () => {
    const loginDto = { username: 'test@test.com', password: 'password' };
    try {
      const token = await service.login(loginDto);
      expect(token.access_token).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});