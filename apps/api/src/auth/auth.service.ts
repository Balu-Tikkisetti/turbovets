import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterUserDto, LoginUserDto, UserDto } from '@turbovets/data';
import { decrypt } from 'dotenv';
import { jwtConfig } from '../config/app.config';

/**
 * Parse time string (e.g., '1h', '30m', '3600s') to seconds
 */
function parseExpiryToSeconds(expiryString: string): number {
  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Default 1 hour
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
}


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
    if(!user){
      throw new UnauthorizedException('username does not exist create new account with this username');
    }

    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('password is wrong');
    }

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userService.updateLastLogin(user.id);
    await this.userService.updateRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);
    await this.userService.updateLastActivity(user.id);

    const payload = { 
      username: user.username, 
      userId: user.id, 
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
      access_token: this.jwtService.sign(payload, { expiresIn: jwtConfig.expiresIn }),
      refresh_token: refreshToken,
      expires_in: parseExpiryToSeconds(jwtConfig.expiresIn), 
      user: userDto,
    };
  }

  async register(dto: RegisterUserDto) {
    try{
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      return await this.userService.create({
        ...dto,
        password: hashedPassword,
      });
    }catch(err){
      if (err instanceof ConflictException) {
        throw err;
      }
      throw new ConflictException('Registration failed due to duplicate email or username');
    }

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

    const userDto: UserDto = {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: jwtConfig.expiresIn }),
      refresh_token: newRefreshToken,
      expires_in: parseExpiryToSeconds(jwtConfig.expiresIn), 
      user: userDto,
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