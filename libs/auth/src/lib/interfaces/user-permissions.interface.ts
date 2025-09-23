import { Role } from '../enums/role.enum';

export interface UserPermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  canViewAllDepartments: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  allowedDepartments: string[];
}

export interface DepartmentPermissions {
  department: string;
  canView: boolean;
  canEdit: boolean;
  canAssign: boolean;
}

export class PermissionService {
  static getUserPermissions(userRole: Role, userDepartment?: string): UserPermissions {
    switch (userRole) {
      case Role.Owner:
        return {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canAssignTasks: true,
          canViewAllDepartments: true,
          canManageUsers: true,
          canViewAnalytics: true,
          allowedDepartments: ['*'] // All departments
        };

      case Role.Admin:
        return {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canAssignTasks: true,
          canViewAllDepartments: false,
          canManageUsers: false,
          canViewAnalytics: true,
          allowedDepartments: userDepartment ? [userDepartment] : []
        };

      case Role.Viewer:
        return {
          canCreateTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canAssignTasks: false,
          canViewAllDepartments: false,
          canManageUsers: false,
          canViewAnalytics: false,
          allowedDepartments: userDepartment ? [userDepartment] : []
        };

      default:
        return {
          canCreateTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canAssignTasks: false,
          canViewAllDepartments: false,
          canManageUsers: false,
          canViewAnalytics: false,
          allowedDepartments: []
        };
    }
  }

  static canAccessDepartment(userRole: Role, userDepartment: string, targetDepartment: string): boolean {
    if (userRole === Role.Owner) return true;
    return userDepartment === targetDepartment;
  }

  static getAssignableRoles(userRole: Role): Role[] {
    switch (userRole) {
      case Role.Owner:
        return [Role.Admin, Role.Viewer];
      case Role.Admin:
        return [Role.Viewer];
      case Role.Viewer:
        return [];
      default:
        return [];
    }
  }

  /**
   * Check if user can edit a task based on their role, task category, and ownership
   * Owner: Can edit all tasks
   * Admin: Can edit all tasks (can reassign)
   * Viewer: Can only edit personal tasks they created
   */
  static canEditTask(userRole: Role, taskCategory: string, isTaskCreator = false): boolean {
    switch (userRole) {
      case Role.Owner:
        return true; // Owner can edit all tasks
      case Role.Admin:
        return true; // Admin can edit all tasks (including reassignment)
      case Role.Viewer:
        // Viewer can only edit personal tasks they created
        return taskCategory === 'personal' && isTaskCreator;
      default:
        return false;
    }
  }

  /**
   * Check if user can delete a task based on their role, task category, and ownership
   * Owner: Can delete all tasks
   * Admin: Cannot delete tasks (only Owner can delete)
   * Viewer: Can only delete personal tasks they created
   */
  static canDeleteTask(userRole: Role, taskCategory: string, isTaskCreator = false): boolean {
    switch (userRole) {
      case Role.Owner:
        return true; // Only Owner can delete any task
      case Role.Admin:
        return false; // Admin cannot delete tasks
      case Role.Viewer:
        // Viewer can only delete personal tasks they created
        return taskCategory === 'personal' && isTaskCreator;
      default:
        return false;
    }
  }

  /**
   * Check if user can reassign tasks
   * Owner: Can reassign all tasks
   * Admin: Can reassign all tasks
   * Viewer: Cannot reassign tasks
   */
  static canReassignTask(userRole: Role): boolean {
    switch (userRole) {
      case Role.Owner:
      case Role.Admin:
        return true;
      case Role.Viewer:
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if user can create tasks of a specific category
   * Owner & Admin: Can create all types of tasks
   * Viewer: Can only create personal tasks
   */
  static canCreateTaskOfCategory(userRole: Role, taskCategory: string): boolean {
    switch (userRole) {
      case Role.Owner:
      case Role.Admin:
        return true; // Can create all types of tasks
      case Role.Viewer:
        return taskCategory === 'personal'; // Can only create personal tasks
      default:
        return false;
    }
  }

  /**
   * Check if user can view a task in "My Tasks" section
   * My Tasks = tasks where user is creator OR assignee
   * Owner: Can see all work tasks they created/assigned + their own personal tasks
   * Admin: Can see work tasks they created/assigned + their own personal tasks  
   * Viewer: Can see personal tasks they created/assigned + work tasks they created/assigned
   */
  static canViewTaskInMyTasks(
    userRole: Role, 
    taskCategory: string, 
    isTaskCreator: boolean, 
    isTaskAssignee: boolean
  ): boolean {
    // Must be either creator or assignee to see in "My Tasks"
    if (!isTaskCreator && !isTaskAssignee) {
      return false;
    }

    switch (userRole) {
      case Role.Owner:
        // Owner can see all work tasks + their own personal tasks
        if (taskCategory === 'work') {
          return true; // Can see all work tasks they created/assigned
        } else {
          return isTaskCreator; // Can only see personal tasks they created (not assigned to them by others)
        }
        
      case Role.Admin:
        // Admin can see work tasks they created/assigned + their own personal tasks
        if (taskCategory === 'work') {
          return true; // Can see all work tasks they created/assigned
        } else {
          return isTaskCreator; // Can only see personal tasks they created
        }
        
      case Role.Viewer:
        // Viewer can see personal tasks they created/assigned + work tasks they created/assigned
        if (taskCategory === 'personal') {
          return true; // Can see personal tasks they created or are assigned to
        } else {
          return true; // Can see work tasks they created or are assigned to
        }
        
      default:
        return false;
    }
  }
}
