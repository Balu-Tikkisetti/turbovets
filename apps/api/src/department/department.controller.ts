import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DepartmentService, CreateDepartmentDto, UpdateDepartmentDto } from './department.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@turbovets/data';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Roles(Role.Owner, Role.Admin)
  async create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: Request) {
    const userId = req.user['userId'];
    
    const department = await this.departmentService.createDepartment(createDepartmentDto);
    
    // Log the department creation
    await this.auditLogService.log(
      AuditAction.CREATE,
      AuditResource.DEPARTMENT,
      userId,
      department.id,
      `Department "${department.name}" created`,
      { departmentName: department.name, departmentColor: department.color },
      req.ip,
      req.get('User-Agent'),
    );
    
    return department;
  }

  @Get()
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findAll(@Req() req: Request) {
    const userRole = req.user['role'] as Role;
    const userDepartment = req.user['department'];
    
    // If user is Owner, return all departments
    if (userRole === Role.Owner) {
      return this.departmentService.findAllDepartments();
    }
    
    // For Admin and Viewer, return only their department
    if (userRole === Role.Admin || userRole === Role.Viewer) {
      if (userDepartment) {
        // Return only the user's department
        const departments = await this.departmentService.findAllDepartments();
        return departments.filter(dept => dept.name === userDepartment);
      }
      return [];
    }
    
    return [];
  }

  @Get('names')
  async getDepartmentNames() {
    return this.departmentService.getDepartmentNames();
  }

  @Get(':id')
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findOne(@Param('id') id: string) {
    return this.departmentService.findDepartmentById(id);
  }

  @Get(':id/stats')
  @Roles(Role.Owner, Role.Admin)
  async getStats(@Param('id') id: string) {
    return this.departmentService.getDepartmentStats(id);
  }

  @Patch(':id')
  @Roles(Role.Owner, Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    
    const updatedDepartment = await this.departmentService.updateDepartment(id, updateDepartmentDto);
    
    // Log the department update
    await this.auditLogService.log(
      AuditAction.UPDATE,
      AuditResource.DEPARTMENT,
      userId,
      id,
      `Department "${updatedDepartment.name}" updated`,
      { 
        updatedFields: Object.keys(updateDepartmentDto),
        departmentName: updatedDepartment.name 
      },
      req.ip,
      req.get('User-Agent'),
    );
    
    return updatedDepartment;
  }

  @Delete(':id')
  @Roles(Role.Owner)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user['userId'];
    
    // Get department details before deletion for audit log
    const departmentToDelete = await this.departmentService.findDepartmentById(id);
    
    await this.departmentService.deleteDepartment(id);
    
    // Log the department deletion
    await this.auditLogService.log(
      AuditAction.DELETE,
      AuditResource.DEPARTMENT,
      userId,
      id,
      `Department "${departmentToDelete.name}" deleted`,
      { departmentName: departmentToDelete.name },
      req.ip,
      req.get('User-Agent'),
    );
    
    return { success: true, message: 'Department deleted successfully' };
  }
}
