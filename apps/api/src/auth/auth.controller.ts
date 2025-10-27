import { Body, Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto,LoginUserDto } from '@turbovets/data';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

 
  @Post('login')
  async login(@Body() dto:LoginUserDto) {
    return this.authService.login(dto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any) {
    const userId = req.user['userId'];
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('activity')
  async updateActivity(@Request() req: any) {
    const userId = req.user['userId'];
    await this.authService.updateUserActivity(userId);
    return { message: 'Activity updated successfully' };
  }
}
