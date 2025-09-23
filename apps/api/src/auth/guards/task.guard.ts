import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@turbovets/data';
import { TaskCategory } from '@turbovets/data';
import { PermissionService } from '@turbovets/auth/backend';

export interface TaskPermission {
  action: 'edit' | 'delete' | 'reassign';
  requireOwnership?: boolean;
}

export const TASK_PERMISSION_KEY = 'task_permission';

@Injectable()
export class TaskGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const taskPermission = this.reflector.getAllAndOverride<TaskPermission>(
      TASK_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!taskPermission) {
      return true; // No task restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const taskId = request.params?.id || request.body?.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get task details from request body or fetch from service
    const task = request.task || request.body;
    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    const userRole = user.role as Role;
    const taskCategory = task.category as TaskCategory;
    const isTaskCreator = task.createdBy === user.userId;

    // Check permissions based on action
    switch (taskPermission.action) {
      case 'edit':
        const canEdit = PermissionService.canEditTask(userRole, taskCategory, isTaskCreator);
        if (!canEdit) {
          throw new ForbiddenException(
            `Access denied. You cannot edit this task. ${userRole === Role.Viewer ? 'Viewers can only edit personal tasks they created.' : ''}`
          );
        }
        break;

      case 'delete':
        const canDelete = PermissionService.canDeleteTask(userRole, taskCategory, isTaskCreator);
        if (!canDelete) {
          throw new ForbiddenException(
            `Access denied. You cannot delete this task. ${userRole === Role.Admin ? 'Only Owner can delete tasks.' : userRole === Role.Viewer ? 'Viewers can only delete personal tasks they created.' : ''}`
          );
        }
        break;

      case 'reassign':
        const canReassign = PermissionService.canReassignTask(userRole);
        if (!canReassign) {
          throw new ForbiddenException('Access denied. You cannot reassign tasks.');
        }
        break;

      default:
        throw new ForbiddenException('Invalid task action');
    }

    return true;
  }
}
