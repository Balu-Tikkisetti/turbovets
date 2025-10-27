import { Role } from '../enums/role.enum';

export interface RBACConfig {
  allowedRoles: Role[];
  requireAll?: boolean;
  customCheck?: (user: any) => boolean;
}

export function RequireRoles(config: RBACConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Get current user from component context
      const component = this as any;
      
      // Try to get current user from different possible sources
      let currentUser = null;
      
      if (component.currentUser$ && typeof component.currentUser$.subscribe === 'function') {
        // If it's an observable, we need to handle it differently
        console.warn('RequireRoles: Cannot access observable user in decorator. Use guard or component-level checks instead.');
        return;
      } else if (component.currentUser) {
        currentUser = component.currentUser;
      } else if (component.user) {
        currentUser = component.user;
      }
      
      if (!currentUser) {
        console.warn('RequireRoles: User not authenticated for analytics access');
        return;
      }

      // Check if user has required role
      if (!config.allowedRoles.includes(currentUser.role)) {
        console.warn(`RequireRoles: Access denied. Required roles: ${config.allowedRoles.join(', ')}. User role: ${currentUser.role}`);
        return;
      }

      // Custom check if provided
      if (config.customCheck && !config.customCheck(currentUser)) {
        console.warn('RequireRoles: Custom access check failed');
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function RequireOwner() {
  return RequireRoles({ allowedRoles: [Role.Owner] });
}

export function RequireAdmin() {
  return RequireRoles({ allowedRoles: [Role.Owner, Role.Admin] });
}

export function RequireViewer() {
  return RequireRoles({ allowedRoles: [Role.Owner, Role.Admin, Role.Viewer] });
}
