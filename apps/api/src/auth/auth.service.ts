import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from 'libs/data/src/lib/dto/register-user.dto';
import {LoginUserDto} from 'libs/data/src/lib/dto/login-user.dto';

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

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.create({
      ...dto,
      password: hashedPassword
    });
  }
}
