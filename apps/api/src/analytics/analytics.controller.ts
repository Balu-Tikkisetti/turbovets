import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsGuard } from './analytics.guard';
import { Role } from '@turbovets/data';
import { AnalyticsService, AnalyticsFilters } from './analytics.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: Role;
    department?: string;
    username?: string;
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, AnalyticsGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('timeRange') timeRange?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Validate time range
    if (timeRange && !['7', '30', '90', '365'].includes(timeRange)) {
      throw new BadRequestException('Invalid time range. Must be 7, 30, 90, or 365 days.');
    }

    // Validate date range
    let start: Date | undefined;
    let end: Date | undefined;
    
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid start date format.');
      }
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Invalid end date format.');
      }
    }

    // Validate date range logic
    if (start && end && start > end) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const filters: AnalyticsFilters = {
      timeRange,
      userId,
      startDate: start,
      endDate: end,
    };

    // Get simple audit log data
    const auditData = await this.analyticsService.getRecentActivity(filters, userRole, userDepartment);

    const response = {
      success: true,
      data: {
        auditLogs: auditData,
        totalCount: auditData.length,
        timeRange: timeRange || '30',
        filters: filters
      },
      timestamp: new Date().toISOString(),
    };
    return response;
  }

  @Get('user-activity')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getUserActivity(
    @Req() req: AuthenticatedRequest,
    @Query('timeRange') timeRange?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    const filters: AnalyticsFilters = {
      timeRange,
      department: department === 'all' ? undefined : department,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const userActivity = await this.analyticsService.getUserActivity(filters, userRole, userDepartment);
    
    return {
      success: true,
      data: userActivity,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('department-stats')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getDepartmentStats(
    @Req() req: AuthenticatedRequest,
    @Query('timeRange') timeRange?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    const filters: AnalyticsFilters = {
      timeRange,
      department: department === 'all' ? undefined : department,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const departmentStats = await this.analyticsService.getDepartmentStats(filters, userRole, userDepartment);
    
    return {
      success: true,
      data: departmentStats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('activity-logs')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getActivityLogs(
    @Req() req: AuthenticatedRequest,
    @Query('timeRange') timeRange?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    const filters: AnalyticsFilters = {
      timeRange,
      department: department === 'all' ? undefined : department,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const activityLogs = await this.analyticsService.getRecentActivity(filters, userRole, userDepartment);
    
    return {
      success: true,
      data: activityLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activityLogs.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('task-trends')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getTaskTrends(
    @Req() req: AuthenticatedRequest,
    @Query('timeRange') timeRange?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    const filters: AnalyticsFilters = {
      timeRange,
      department: department === 'all' ? undefined : department,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const taskTrends = await this.analyticsService.getTaskTrends(filters, userRole, userDepartment);
    
    return {
      success: true,
      data: taskTrends,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('export')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async exportAnalytics(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
      format: 'csv' | 'pdf' | 'excel';
      timeRange?: string;
      department?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Validate format
    if (!['csv', 'pdf', 'excel'].includes(body.format)) {
      throw new BadRequestException('Invalid export format. Must be csv, pdf, or excel.');
    }

    const filters: AnalyticsFilters = {
      timeRange: body.timeRange,
      department: body.department === 'all' ? undefined : body.department,
      userId,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    };

    const downloadUrl = await this.analyticsService.exportAnalytics(body.format, filters, userRole, userDepartment);
    
    return {
      success: true,
      downloadUrl,
      format: body.format,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('system-metrics')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getSystemMetrics() {
    const systemMetrics = await this.analyticsService.getSystemMetrics();
    
    return {
      success: true,
      data: systemMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('realtime-updates')
  @Roles(Role.Owner, Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getRealtimeUpdates(
    @Req() req: AuthenticatedRequest,
    @Query('lastUpdate') lastUpdate?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Get updates since last check
    const since = lastUpdate ? new Date(lastUpdate) : new Date(Date.now() - 30000); // Default to 30 seconds ago
    
    const [systemMetrics, recentActivity] = await Promise.all([
      this.analyticsService.getSystemMetrics(),
      this.analyticsService.getRecentActivity(
        { startDate: since, endDate: new Date() },
        userRole,
        userDepartment
      )
    ]);
    
    return {
      success: true,
      data: {
        systemMetrics,
        recentActivity: recentActivity.slice(0, 10), // Only return last 10 activities
        lastUpdate: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}