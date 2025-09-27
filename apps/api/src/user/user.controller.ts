import { Controller, Get, Param, Post, Body, Delete, Patch, UseGuards, Req, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto, Role } from '@turbovets/data';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepartmentGuard, RequireAdminOrOwner, RequireOwnDepartment } from '@turbovets/auth/backend';
import { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/details')
  @UseGuards(JwtAuthGuard)
  getProfileDetails(@Req() req: Request) {
    const userId = req.user['userId'];
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.userService.getProfileDetails(userId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  getActiveUsers() {
    return this.userService.getActiveUsers();
  }

  @Get('session/status')
  @UseGuards(JwtAuthGuard)
  checkSessionStatus(@Req() req: Request) {
    const userId = req.user['userId'];
    
    return {
      isActive: true,
      userId: userId,
      message: 'Session is valid'
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get('departments')
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireAdminOrOwner()
  getDepartments() {
    return this.userService.getDepartments();
  }

  @Get('by-department/:department')
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireOwnDepartment()
  getUsersByDepartment(
    @Param('department') department: string,
    @Query('roles') roles?: string,
    @Query('sortBy') sortBy: 'role' | 'name' = 'role'
  ) {
    const roleFilter = roles ? roles.split(',') as Role[] : undefined;
    return this.userService.getUsersByDepartment(department, roleFilter, sortBy);
  }

  @Get('assignable')
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireAdminOrOwner()
  getAssignableUsers(
    @Req() req: Request,
    @Query('department') department?: string,
    @Query('excludeCurrentUser') excludeCurrentUser = true
  ) {
    const currentUserId = req.user['userId'];
    const userRole = req.user['role'] as Role;
    const userDepartment = req.user['department'];
    
    // For Admin users, restrict to their own department only
    if (userRole === Role.Admin && userDepartment) {
      return this.userService.getAssignableUsers(userDepartment, excludeCurrentUser, currentUserId);
    }
    
    // For Owner users, allow access to any department
    return this.userService.getAssignableUsers(department, excludeCurrentUser, currentUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }



  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: RegisterUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateData: { role?: string; department?: string | null }, @Req() req: Request) {
    const performedByUserId = req.user['userId'];
    return this.userService.updateUser(id, updateData, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
