import { createAction, props } from '@ngrx/store';
import { UserDto } from '@turbovets/data';

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

// Load Departments Actions
export const loadDepartments = createAction('[Department] Load Departments');
export const loadDepartmentsSuccess = createAction(
  '[Department] Load Departments Success',
  props<{ departments: string[] }>()
);
export const loadDepartmentsFailure = createAction(
  '[Department] Load Departments Failure',
  props<{ error: string }>()
);

// Load Users by Department Actions
export const loadUsersByDepartment = createAction(
  '[Department] Load Users By Department',
  props<{ department: string; roles?: string[]; sortBy?: 'role' | 'name' }>()
);
export const loadUsersByDepartmentSuccess = createAction(
  '[Department] Load Users By Department Success',
  props<{ department: string; users: UserDto[] }>()
);
export const loadUsersByDepartmentFailure = createAction(
  '[Department] Load Users By Department Failure',
  props<{ department: string; error: string }>()
);

// Load Assignable Users Actions
export const loadAssignableUsers = createAction(
  '[Department] Load Assignable Users',
  props<{ department?: string; excludeCurrentUser?: boolean }>()
);
export const loadAssignableUsersSuccess = createAction(
  '[Department] Load Assignable Users Success',
  props<{ users: UserDto[]; department?: string }>()
);
export const loadAssignableUsersFailure = createAction(
  '[Department] Load Assignable Users Failure',
  props<{ error: string }>()
);

// Cache Management Actions
export const clearDepartmentCache = createAction('[Department] Clear Cache');
export const clearDepartmentUsersCache = createAction(
  '[Department] Clear Department Users Cache',
  props<{ department: string }>()
);

// Selection Actions
export const selectDepartment = createAction(
  '[Department] Select Department',
  props<{ department: string }>()
);
export const clearDepartmentSelection = createAction('[Department] Clear Selection');