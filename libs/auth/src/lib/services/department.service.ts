import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserDto } from '../interfaces/user.dto';
import { Role } from '../enums/role.enum';
import { UserPermissions, PermissionService } from '../interfaces/user-permissions.interface';

export interface DepartmentUsers {
  department: string;
  users: UserDto[];
  lastUpdated: number;
}

export interface AssignableUsers {
  department?: string;
  users: UserDto[];
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private departmentsCache = new Map<string, DepartmentUsers>();
  private assignableUsersCache = new Map<string, AssignableUsers>();
  private departmentsSubject = new BehaviorSubject<string[]>([]);

  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    // Service initialization
  }

  // Get cached departments or return empty array
  getCachedDepartments(): string[] {
    return this.departmentsSubject.value;
  }

  // Get cached users for a department
  getCachedDepartmentUsers(department: string): UserDto[] {
    const cached = this.departmentsCache.get(department);
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.users;
    }
    return [];
  }

  // Get cached assignable users
  getCachedAssignableUsers(department?: string): UserDto[] {
    const cacheKey = department || 'all';
    const cached = this.assignableUsersCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.users;
    }
    return [];
  }

  // Sort users by role (Admin first, then Viewer), then by name
  sortUsersByRole(users: UserDto[]): UserDto[] {
    return users.sort((a, b) => {
      // Role priority: Admin (1), Viewer (2), Owner (0 - highest)
      const rolePriority = (role: Role) => {
        switch (role) {
          case Role.Owner: return 0;
          case Role.Admin: return 1;
          case Role.Viewer: return 2;
          default: return 3;
        }
      };

      const aPriority = rolePriority(a.role as Role);
      const bPriority = rolePriority(b.role as Role);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // If same role, sort by username
      return a.username.localeCompare(b.username);
    });
  }

  // Filter users by roles
  filterUsersByRoles(users: UserDto[], roles: Role[]): UserDto[] {
    if (!roles || roles.length === 0) return users;
    return users.filter(user => roles.includes(user.role as Role));
  }

  // Get user permissions
  getUserPermissions(userRole: Role, userDepartment?: string): UserPermissions {
    return PermissionService.getUserPermissions(userRole, userDepartment);
  }

  // Check if user can access department
  canAccessDepartment(userRole: Role, userDepartment: string, targetDepartment: string): boolean {
    return PermissionService.canAccessDepartment(userRole, userDepartment, targetDepartment);
  }

  // Get assignable roles for user
  getAssignableRoles(userRole: Role): Role[] {
    return PermissionService.getAssignableRoles(userRole);
  }

  // Cache management
  setDepartmentsCache(departments: string[]): void {
    this.departmentsSubject.next(departments);
  }

  setDepartmentUsersCache(department: string, users: UserDto[]): void {
    this.departmentsCache.set(department, {
      department,
      users,
      lastUpdated: Date.now()
    });
  }

  setAssignableUsersCache(department: string | undefined, users: UserDto[]): void {
    const cacheKey = department || 'all';
    this.assignableUsersCache.set(cacheKey, {
      department,
      users,
      lastUpdated: Date.now()
    });
  }

  clearCache(): void {
    this.departmentsCache.clear();
    this.assignableUsersCache.clear();
    this.departmentsSubject.next([]);
  }

  clearDepartmentCache(department: string): void {
    this.departmentsCache.delete(department);
    this.assignableUsersCache.delete(department);
    this.assignableUsersCache.delete('all');
  }

  private isCacheValid(lastUpdated: number): boolean {
    return Date.now() - lastUpdated < this.CACHE_TTL;
  }
}
