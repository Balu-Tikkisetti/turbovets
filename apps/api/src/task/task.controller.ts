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
  ConflictException,
  Query,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TaskGuard } from '../auth/guards/task.guard';
 
import { Role, TaskStatus } from '@turbovets/data';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';
import { CreateTaskDto } from '@turbovets/data';
import { UpdateTaskDto } from '@turbovets/data';
import { Task } from '../entities/task.entity';
import { CurrentUserId, CurrentUserRole, CurrentUserDepartment } from '@turbovets/auth/backend';

// Extend Request interface to include task property
interface RequestWithTask extends Request {
  task?: Task;
}

@UseGuards(JwtAuthGuard, RolesGuard, TaskGuard)
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditLogService: AuditLogService
  ) {}

  @Post()
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
    const creatorId = req.user['userId'];
    const userRole = req.user['role'] as Role;
    const userDepartment = req.user['department'];

    const task = await this.taskService.createTask(
      createTaskDto,
      creatorId,
      userRole,
      userDepartment
    );

    // Log the task creation
    await this.auditLogService.log(
      AuditAction.CREATE,
      AuditResource.TASK,
      creatorId,
      task.id,
      `Task "${task.title}" created`,
      { taskCategory: task.category, taskPriority: task.priority },
      req.ip,
      req.get('User-Agent')
    );

    // Statistics will be updated via polling

    return task;
  }

  @Get('all_work_tasks_in_organization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findAllWorkTasksOrganization(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 25;

      const result = await this.taskService.findAllWorkTasksOrganization(
        pageNum,
        limitNum
      );
      return result;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error.message || 'Failed to fetch tasks'
      );
    }
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findMyTasks(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const userId = req.user['userId'];
      const userRole = req.user['role'] as Role;
      const userDepartment = req.user['department'];
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      // Get tasks where user is creator or assignee
      const tasks = await this.taskService.findMyTasks(
        userId,
        userRole,
        userDepartment,
        pageNum,
        limitNum
      );
      return tasks;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new Error(error.message);
    }
  }



  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user['userId'];
    const role = req.user['role'];
    return this.taskService.findTaskById(id, userId, role);
  }

  @Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Owner, Role.Admin, Role.Viewer)
async update(
  @Param('id') id: string,
  @Body() updateTaskDto: UpdateTaskDto,
  @Req() req: RequestWithTask,
  @CurrentUserId() userId: string,
  @CurrentUserRole() role: Role,
  @CurrentUserDepartment() department: string
) {
  try {
    const updatedTask = await this.taskService.updateTask(
      id,
      updateTaskDto,
      userId,
      role,
      department
    );

    // Log the task update
    try {
      await this.auditLogService.log(
        AuditAction.UPDATE,
        AuditResource.TASK,
        userId,
        id,
        `Task "${updatedTask.title}" updated`,
        {
          updatedFields: Object.keys(updateTaskDto),
          taskCategory: updatedTask.category,
          taskPriority: updatedTask.priority,
          taskStatus: updatedTask.status,
        },
        req.ip,
        req.get('User-Agent')
      );
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }
    return updatedTask;
    
  } catch (error) {
  
    if (
      error instanceof NotFoundException ||
      error instanceof ForbiddenException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }
    
    // Catch any other unexpected errors
    console.error('Unexpected error in update controller:', error);
    throw new InternalServerErrorException('An unexpected error occurred while updating the task.');
  }
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async remove(@Param('id') id: string, @CurrentUserId() userId: string, @CurrentUserRole() role: Role) {
    // Get task details before deletion for audit log and permission checking
    const taskToDelete = await this.taskService.getTaskForAudit(id);

    await this.taskService.deleteTask(id, userId,role);

    // Log the task deletion (with error handling)
    try {
      await this.auditLogService.log(
        AuditAction.DELETE,
        AuditResource.TASK,
        userId,
        id,
        `Task "${taskToDelete.title}" deleted`,
        {
          taskCategory: taskToDelete.category,
          taskPriority: taskToDelete.priority,
          taskStatus: taskToDelete.status,
        },

      );
    } catch {
  // 
    }

    return { success: true, message: 'Task deleted successfully' };
  }


  



  @Patch(':id/department')
  @Roles(Role.Owner)
  async moveTaskToDepartment(
    @Param('id') id: string,
    @Body() body: { department: string },
    @Req() req: Request
  ) {
    const userId = req.user['userId'];
    const role = req.user['role'];

    const updatedTask = await this.taskService.moveTaskToDepartment(
      id,
      body.department,
      userId,
      role
    );

    // Log department transfer
    await this.auditLogService.log(
      AuditAction.UPDATE,
      AuditResource.TASK,
      userId,
      id,
      `Task "${updatedTask.title}" moved to department "${body.department}"`,
      {
        taskCategory: updatedTask.category,
        taskPriority: updatedTask.priority,
        oldDepartment: updatedTask.department,
        newDepartment: body.department,
      },
      req.ip,
      req.get('User-Agent')
    );

    return updatedTask;
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin)
  async assignTask(
    @Param('id') id: string,
    @Body() body: { assigneeId: string },
    @Req() req: RequestWithTask
  ) {
    const userId = req.user['userId'];
    const role = req.user['role'];

    // Fetch task for permission checking
    const task = await this.taskService.findTaskById(id, userId, role);
    req.task = task; // Make task available to the guard

    const oldAssigneeId = task.assigneeId;
    const updatedTask = await this.taskService.assignTask(
      id,
      body.assigneeId,
      userId,
      role
    );

    // Log the task assignment
    await this.auditLogService.log(
      AuditAction.UPDATE,
      AuditResource.TASK,
      userId,
      id,
      `Task "${updatedTask.title}" assigned to user "${body.assigneeId}"`,
      {
        taskCategory: updatedTask.category,
        taskPriority: updatedTask.priority,
        oldAssigneeId: oldAssigneeId,
        newAssigneeId: body.assigneeId,
        taskDepartment: updatedTask.department,
      },
      req.ip,
      req.get('User-Agent')
    );

    return updatedTask;
  }
}

