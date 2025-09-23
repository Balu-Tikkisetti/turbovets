import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEPARTMENT_PERMISSIONS_KEY, DepartmentPermission } from '../decorators/department.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class DepartmentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<DepartmentPermission>(
      DEPARTMENT_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permissions) {
      return true; // No department restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check role permissions
    if (!permissions.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied. Required roles: ${permissions.allowedRoles.join(', ')}`);
    }

    // Check department-specific permissions
    // Owner role users have access to all departments, so skip department restrictions for them
    if (permissions.requireOwnDepartment && user.role !== Role.Owner && user.department !== request.params?.department) {
      throw new ForbiddenException('Access denied. You can only access your own department');
    }

    // Check specific department access
    // Owner role users have access to all departments, so skip department restrictions for them
    if (permissions.allowedDepartments && user.role !== Role.Owner && !permissions.allowedDepartments.includes(user.department)) {
      throw new ForbiddenException(`Access denied. Your department is not authorized for this action`);
    }

    return true;
  }
}
