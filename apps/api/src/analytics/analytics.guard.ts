import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@turbovets/data';
import { ROLES_KEY } from '../auth/roles.decorator';

@Injectable()
export class AnalyticsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`
      );
    }

    // Additional analytics-specific checks
    if (user.role === Role.Admin && !user.department) {
      throw new ForbiddenException('Admin users must have a department assigned to access analytics');
    }

    // Check if user has been active recently (within last 30 days)
    const lastActivity = user.lastLogin || user.createdAt;
    const daysSinceLastActivity = (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 30) {
      throw new ForbiddenException('Account has been inactive for too long. Please contact administrator.');
    }

    return true;
  }
}
