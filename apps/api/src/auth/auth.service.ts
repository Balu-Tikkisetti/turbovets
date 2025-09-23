import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterUserDto, LoginUserDto, UserDto } from '@turbovets/data';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.userService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginUserDto) {
    const user = await this.userService.findByUsername(dto.username);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userService.updateLastLogin(user.id);
    await this.userService.updateRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);
    await this.userService.updateLastActivity(user.id);

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role,
      department: user.department 
    };

    const userDto: UserDto = {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: refreshToken,
      expires_in: 15 * 60,
      user: userDto,
    };
  }

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.create({
      ...dto,
      password: hashedPassword,
    });
  }

  async refreshToken(refreshToken: string) {
    const user = await this.userService.findByRefreshToken(refreshToken);

    if (!user || !user.refreshToken || user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const lastActivity = user.lastActivityAt || user.lastLoginAt;
    const minutesSinceLastActivity = (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60);
    
    if (minutesSinceLastActivity > 30) {
      await this.userService.updateRefreshToken(user.id, null, null);
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userService.updateRefreshToken(user.id, newRefreshToken, newRefreshTokenExpiresAt);
    await this.userService.updateLastActivity(user.id);

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role,
      department: user.department 
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: newRefreshToken,
      expires_in: 15 * 60,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshToken(userId, null, null);
    await this.userService.updateUserActiveStatus(userId, false);
  }

  async updateUserActivity(userId: string): Promise<void> {
    await this.userService.updateLastActivity(userId);
  }
}