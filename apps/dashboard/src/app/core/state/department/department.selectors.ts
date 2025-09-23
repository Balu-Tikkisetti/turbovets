import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DepartmentState } from './department.reducer';
import { UserDto, Role } from '@turbovets/data';

export const selectDepartmentState = createFeatureSelector<DepartmentState>('department');

// Basic selectors
export const selectDepartments = createSelector(
  selectDepartmentState,
  (state) => state.departments
);

export const selectDepartmentUsers = createSelector(
  selectDepartmentState,
  (state) => state.departmentUsers
);

export const selectAssignableUsers = createSelector(
  selectDepartmentState,
  (state) => state.assignableUsers
);

export const selectSelectedDepartment = createSelector(
  selectDepartmentState,
  (state) => state.selectedDepartment
);

export const selectDepartmentLoading = createSelector(
  selectDepartmentState,
  (state) => state.loading
);

export const selectDepartmentError = createSelector(
  selectDepartmentState,
  (state) => state.error
);

// Computed selectors
export const selectUsersByDepartment = createSelector(
  selectDepartmentUsers,
  (departmentUsers) => (department: string) => departmentUsers[department]?.users || []
);

export const selectSortedUsersByDepartment = createSelector(
  selectDepartmentUsers,
  (departmentUsers) => (department: string, sortBy: 'role' | 'name' = 'role') => {
    const users = departmentUsers[department]?.users || [];
    if (sortBy === 'role') {
      return users.sort((a: UserDto, b: UserDto) => {
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

        return a.username.localeCompare(b.username);
      });
    } else {
      return users.sort((a: UserDto, b: UserDto) => a.username.localeCompare(b.username));
    }
  }
);

export const selectFilteredUsersByDepartment = createSelector(
  selectDepartmentUsers,
  (departmentUsers) => (department: string, roles?: Role[], sortBy: 'role' | 'name' = 'role') => {
    const users = departmentUsers[department]?.users || [];
    let sortedUsers = [...users];
    
    if (sortBy === 'role') {
      sortedUsers.sort((a: UserDto, b: UserDto) => {
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

        return a.username.localeCompare(b.username);
      });
    } else {
      sortedUsers.sort((a: UserDto, b: UserDto) => a.username.localeCompare(b.username));
    }
    
    if (roles && roles.length > 0) {
      sortedUsers = sortedUsers.filter((user: UserDto) => roles.includes(user.role as Role));
    }
    
    return sortedUsers;
  }
);

export const selectAssignableUsersForDepartment = createSelector(
  selectAssignableUsers,
  (assignableUsers) => (department?: string) => {
    if (!assignableUsers) return [];
    
    // If no department specified, return all assignable users
    if (!department) return assignableUsers.users;
    
    // Filter by department if specified
    return assignableUsers.users.filter((user: UserDto) => user.department === department);
  }
);

export const selectSortedAssignableUsers = createSelector(
  selectAssignableUsers,
  (assignableUsers) => (department?: string) => {
    if (!assignableUsers) return [];
    
    let users = assignableUsers.users;
    
    // Filter by department if specified
    if (department) {
      users = users.filter((user: UserDto) => user.department === department);
    }
    
    return users.sort((a: UserDto, b: UserDto) => {
      // Role priority: Admin (1), Viewer (2)
      const rolePriority = (role: Role) => {
        switch (role) {
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

      return a.username.localeCompare(b.username);
    });
  }
);

// Cache status selectors
export const selectDepartmentCacheStatus = createSelector(
  selectDepartmentState,
  (state) => ({
    hasDepartments: state.departments.length > 0,
    hasUsers: Object.keys(state.departmentUsers).length > 0,
    hasAssignableUsers: !!state.assignableUsers,
    lastUpdated: state.lastUpdated,
    isStale: state.lastUpdated ? Date.now() - state.lastUpdated > 5 * 60 * 1000 : true
  })
);

export const selectIsDepartmentDataStale = createSelector(
  selectDepartmentCacheStatus,
  (cacheStatus) => cacheStatus.isStale
);
