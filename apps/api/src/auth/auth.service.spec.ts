import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Role } from '@turbovets/data';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByUsername: jest.fn(),
    updateLastLogin: jest.fn(),
    updateRefreshToken: jest.fn(),
    updateLastActivity: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 'user-123',
        username,
        password: hashedPassword,
        role: Role.Viewer,
        department: 'Engineering',
      };

      mockUserService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(username, password);

      expect(mockUserService.findByUsername).toHaveBeenCalledWith(username);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
        department: mockUser.department,
      });
    });

    it('should return null if user not found', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      mockUserService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 'user-123',
        username,
        password: hashedPassword,
        role: Role.Viewer,
        department: 'Engineering',
      };

      mockUserService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        password: hashedPassword,
        role: Role.Viewer,
        department: 'Engineering',
      };
      const mockToken = 'jwt-token';
      const mockRefreshToken = 'refresh-token';

      mockUserService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);
      mockUserService.updateRefreshToken.mockResolvedValue(undefined);
      mockUserService.updateLastActivity.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: mockToken,
        refresh_token: expect.any(String),
        expires_in: 15 * 60,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          department: mockUser.department,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          username: mockUser.username,
          sub: mockUser.id,
          role: mockUser.role,
          department: mockUser.department,
        },
        { expiresIn: '15m' }
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com',
      };
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 'user-123',
        username: 'newuser',
        email: 'newuser@example.com',
        password: hashedPassword,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(result).toEqual({
        message: 'User registered successfully',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
    });
  });
});
