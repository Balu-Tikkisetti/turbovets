import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export interface DepartmentPermission {
  allowedRoles: Role[];
  allowedDepartments?: string[];
  requireOwnDepartment?: boolean;
}

export const DEPARTMENT_PERMISSIONS_KEY = 'department_permissions';

export const DepartmentAccess = (permissions: DepartmentPermission) =>
  SetMetadata(DEPARTMENT_PERMISSIONS_KEY, permissions);

// Predefined decorators for common scenarios
export const RequireAdminOrOwner = () =>
  DepartmentAccess({ allowedRoles: [Role.Admin, Role.Owner] });

export const RequireOwnDepartment = () =>
  DepartmentAccess({ 
    allowedRoles: [Role.Admin, Role.Owner], 
    requireOwnDepartment: true 
  });

export const RequireSpecificDepartments = (departments: string[]) =>
  DepartmentAccess({ 
    allowedRoles: [Role.Admin, Role.Owner], 
    allowedDepartments: departments 
  });

// Enhanced role-based decorators
export const RequireOwner = () =>
  DepartmentAccess({ allowedRoles: [Role.Owner] });

export const RequireAdmin = () =>
  DepartmentAccess({ allowedRoles: [Role.Admin] });

export const RequireViewer = () =>
  DepartmentAccess({ allowedRoles: [Role.Viewer] });

export const RequireAdminOrViewer = () =>
  DepartmentAccess({ allowedRoles: [Role.Admin, Role.Viewer] });
