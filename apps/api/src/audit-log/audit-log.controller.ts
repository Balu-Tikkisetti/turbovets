import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@turbovets/data';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: Role;
    department?: string;
  };
}

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.Owner, Role.Admin)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit= '50',
  ) {
    const userId = req.user['userId'];
    const role = req.user['role'];
    const department = req.user['department'];

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.auditLogService.findAll(userId, role, department, pageNum, limitNum);
  }
}
