import { createReducer, on } from '@ngrx/store';
import { 
  loadDepartments, 
  loadDepartmentsSuccess, 
  loadDepartmentsFailure,
  loadUsersByDepartment,
  loadUsersByDepartmentSuccess,
  loadUsersByDepartmentFailure,
  loadAssignableUsers,
  loadAssignableUsersSuccess,
  loadAssignableUsersFailure,
  clearDepartmentCache,
  clearDepartmentUsersCache,
  selectDepartment,
  clearDepartmentSelection,
  DepartmentUsers,
  AssignableUsers
} from './department.actions';

export interface DepartmentState {
  departments: string[];
  departmentUsers: { [department: string]: DepartmentUsers };
  assignableUsers: AssignableUsers | null;
  selectedDepartment: string | null;
  loading: {
    departments: boolean;
    users: boolean;
    assignable: boolean;
  };
  error: string | null;
  lastUpdated: number | null;
}

export const initialState: DepartmentState = {
  departments: [],
  departmentUsers: {},
  assignableUsers: null,
  selectedDepartment: null,
  loading: {
    departments: false,
    users: false,
    assignable: false
  },
  error: null,
  lastUpdated: null
};

export const departmentReducer = createReducer(
  initialState,
  
  // Load Departments
  on(loadDepartments, (state) => ({
    ...state,
    loading: { ...state.loading, departments: true },
    error: null
  })),
  
  on(loadDepartmentsSuccess, (state, { departments }) => ({
    ...state,
    departments,
    loading: { ...state.loading, departments: false },
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadDepartmentsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, departments: false },
    error
  })),
  
  // Load Users by Department
  on(loadUsersByDepartment, (state) => ({
    ...state,
    loading: { ...state.loading, users: true },
    error: null
  })),
  
  on(loadUsersByDepartmentSuccess, (state, { department, users }) => ({
    ...state,
    departmentUsers: {
      ...state.departmentUsers,
      [department]: {
        department,
        users,
        lastUpdated: Date.now()
      }
    },
    loading: { ...state.loading, users: false },
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadUsersByDepartmentFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, users: false },
    error
  })),
  
  // Load Assignable Users
  on(loadAssignableUsers, (state) => ({
    ...state,
    loading: { ...state.loading, assignable: true },
    error: null
  })),
  
  on(loadAssignableUsersSuccess, (state, { users, department }) => ({
    ...state,
    assignableUsers: {
      department,
      users,
      lastUpdated: Date.now()
    },
    loading: { ...state.loading, assignable: false },
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadAssignableUsersFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, assignable: false },
    error
  })),
  
  // Cache Management
  on(clearDepartmentCache, (state) => ({
    ...state,
    departments: [],
    departmentUsers: {},
    assignableUsers: null,
    selectedDepartment: null,
    lastUpdated: null
  })),
  
  on(clearDepartmentUsersCache, (state, { department }) => {
    const { [department]: removed, ...remaining } = state.departmentUsers;
    return {
      ...state,
      departmentUsers: remaining
    };
  }),
  
  // Selection
  on(selectDepartment, (state, { department }) => ({
    ...state,
    selectedDepartment: department
  })),
  
  on(clearDepartmentSelection, (state) => ({
    ...state,
    selectedDepartment: null
  }))
);
