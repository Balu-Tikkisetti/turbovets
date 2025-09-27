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
import { TaskService } from './task.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TaskGuard } from '../auth/guards/task.guard';
import { RequireTaskEdit, RequireTaskDelete } from '../auth/decorators/task-permission.decorator';
import { Role, TaskStatus } from '@turbovets/data';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';
import { CreateTaskDto } from '@turbovets/data';
import { UpdateTaskDto } from '@turbovets/data';
import { Task } from '../entities/task.entity';

// Extend Request interface to include task property
interface RequestWithTask extends Request {
  task?: Task;
}

  
  @UseGuards(JwtAuthGuard, RolesGuard, TaskGuard)
  @Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditLogService: AuditLogService,
  ) {}
  
    @Post()
    @Roles(Role.Owner, Role.Admin, Role.Viewer)
    async create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
      const creatorId = req.user['userId'];
      const userRole = req.user['role'] as Role;
      const userDepartment = req.user['department'];
      
      const task = await this.taskService.createTask(createTaskDto, creatorId, userRole, userDepartment);
      
      // Log the task creation
      await this.auditLogService.log(
        AuditAction.CREATE,
        AuditResource.TASK,
        creatorId,
        task.id,
        `Task "${task.title}" created`,
        { taskCategory: task.category, taskPriority: task.priority },
        req.ip,
        req.get('User-Agent'),
      );
      
      // Statistics will be updated via polling
      
      return task;
    }
  
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findAllWorkTasks(@Req() req: Request) {
    const userId = req.user['userId'];
    const userRole = req.user['role'] as Role;
    const userDepartment = req.user['department'];
    
    // Get tasks based on user role and department
    const tasks = await this.taskService.findAllWorkTasks(userId, userRole, userDepartment);
    return tasks;
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Owner, Role.Admin, Role.Viewer)
  async findMyTasks(@Req() req: Request) {
    const userId = req.user['userId'];
    const userRole = req.user['role'] as Role;
    const userDepartment = req.user['department'];
    
    // Get tasks where user is creator or assignee
    const tasks = await this.taskService.findMyTasks(userId, userRole, userDepartment);
    return tasks;
  }


    // Bulk operations endpoints - MUST come before individual routes
    @Post('bulk/delete')
    @Roles(Role.Owner, Role.Admin)
    async bulkDelete(@Body() body: { taskIds: string[] }, @Req() req: Request) {
      const userId = req.user['userId'];
      const role = req.user['role'];

      // Get task details before deletion for audit log (without permission check)
      const tasksToDelete = await Promise.all(
        body.taskIds.map(async id => {
          try {
            return await this.taskService.getTaskForAudit(id);
          } catch {
            return null; // Return null for tasks that don't exist
          }
        })
      ).then(results => results.filter(task => task !== null));

      await this.taskService.bulkDeleteTasks(body.taskIds, userId, role);

      // Log bulk deletion (with error handling)
      try {
        await this.auditLogService.log(
          AuditAction.DELETE,
          AuditResource.TASK,
          userId,
          'bulk',
          `Bulk deleted ${body.taskIds.length} tasks`,
          { 
            taskIds: body.taskIds,
            taskTitles: tasksToDelete.map(t => t.title)
          },
          req.ip,
          req.get('User-Agent'),
        );
      } catch {
        // Don't throw the error - bulk deletion was successful
      }

      return { success: true, message: `${body.taskIds.length} tasks deleted successfully` };
    }

    @Get(':id')
    @Roles(Role.Owner, Role.Admin, Role.Viewer)
    async findOne(@Param('id') id: string, @Req() req: Request) {
      const userId = req.user['userId'];
      const role = req.user['role'];
      return this.taskService.findTaskById(id, userId, role);
    }
  
    @Patch(':id')
    @Roles(Role.Owner, Role.Admin, Role.Viewer)
    @RequireTaskEdit()
    async update(
      @Param('id') id: string,
      @Body() updateTaskDto: UpdateTaskDto,
      @Req() req: RequestWithTask,
    ) {
      const userId = req.user['userId'];
      const role = req.user['role'];
      
      // Fetch task for permission checking
      const task = await this.taskService.findTaskById(id, userId, role);
      req.task = task; // Make task available to the guard
      
      const updatedTask = await this.taskService.updateTask(id, updateTaskDto, userId, role);
      
      // Log the task update
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
          taskStatus: updatedTask.status
        },
        req.ip,
        req.get('User-Agent'),
      );
      
      // Statistics will be updated via polling
      
      return updatedTask;
    }

    @Delete(':id')
    @Roles(Role.Owner, Role.Viewer)
    @RequireTaskDelete()
    async remove(@Param('id') id: string, @Req() req: RequestWithTask) {
      const userId = req.user['userId'];
      const role = req.user['role'];
      
      // Get task details before deletion for audit log and permission checking
      const taskToDelete = await this.taskService.getTaskForAudit(id);
      req.task = taskToDelete; // Make task available to the guard
      
      await this.taskService.deleteTask(id, userId, role);
      
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
            taskStatus: taskToDelete.status
          },
          req.ip,
          req.get('User-Agent'),
        );
      } catch {
        // Don't throw the error - task deletion was successful
      }
      
  
      
      return { success: true, message: 'Task deleted successfully' };
    }

    @Post('bulk-update-status')
    @Roles(Role.Owner, Role.Admin)
    async bulkUpdateStatus(
      @Body() body: { taskIds: string[]; status: string },
      @Req() req: Request
    ) {
      const userId = req.user['userId'];
      const role = req.user['role'];
      
      const updatedTasks = await this.taskService.bulkUpdateTaskStatus(
        body.taskIds,
        body.status as TaskStatus,
        userId,
        role
      );
      
      // Log bulk status update
      await this.auditLogService.log(
        AuditAction.UPDATE,
        AuditResource.TASK,
        userId,
        'bulk',
        `Bulk updated status to "${body.status}" for ${body.taskIds.length} tasks`,
        { 
          taskIds: body.taskIds,
          newStatus: body.status,
          taskTitles: updatedTasks.map(t => t.title)
        },
        req.ip,
        req.get('User-Agent'),
      );
      
      return updatedTasks;
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
          newDepartment: body.department
        },
        req.ip,
        req.get('User-Agent'),
      );
      
      return updatedTask;
    }

    @Patch(':id/assign')
    @Roles(Role.Owner, Role.Admin)
    @RequireTaskEdit()
    async assignTask(
      @Param('id') id: string,
      @Body() body: { assigneeId: string },
      @Req() req: RequestWithTask,
    ) {
      const userId = req.user['userId'];
      const role = req.user['role'];
      
      // Fetch task for permission checking
      const task = await this.taskService.findTaskById(id, userId, role);
      req.task = task; // Make task available to the guard
      
      const oldAssigneeId = task.assigneeId;
      const updatedTask = await this.taskService.assignTask(id, body.assigneeId, userId, role);
      
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
          taskDepartment: updatedTask.department
        },
        req.ip,
        req.get('User-Agent'),
      );
      
      
      return updatedTask;
    }
  }
  