import { createReducer, on } from '@ngrx/store';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@turbovets/data';
import { 
  loadTasks, 
  loadTasksSuccess, 
  loadTasksFailure,
  loadMyTasks,
  loadMyTasksSuccess,
  loadMyTasksFailure,
  loadTaskStatistics,
  loadTaskStatisticsSuccess,
  loadTaskStatisticsFailure,
  createTask,
  createTaskSuccess,
  createTaskFailure,
  updateTask,
  updateTaskSuccess,
  updateTaskFailure,
  deleteTask,
  deleteTaskSuccess,
  deleteTaskFailure,
  moveTaskToDepartment,
  moveTaskToDepartmentSuccess,
  moveTaskToDepartmentFailure,
  assignTask,
  assignTaskSuccess,
  assignTaskFailure,
  setTaskFilters,
  clearTaskFilters,
  setTaskSort,
  bulkUpdateTasks,
  bulkDeleteTasks,
  bulkDeleteTasksSuccess,
  bulkDeleteTasksFailure,
  bulkUpdateTaskStatus,
  bulkUpdateTaskStatusSuccess,
  bulkUpdateTaskStatusFailure,
  TaskFilters,
  TaskSortOptions
} from './task.actions';

export interface TaskState {
  tasks: Task[];
  myTasks: Task[];
  statistics: any;
  filteredTasks: Task[];
  filters: TaskFilters;
  sort: TaskSortOptions;
  loading: boolean;
  myTasksLoading: boolean;
  statisticsLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const initialState: TaskState = {
  tasks: [],
  myTasks: [],
  statistics: null,
  filteredTasks: [],
  filters: {
    searchTerm: '',
    category: '',
    status: '',
    priority: '',
    assigneeId: '',
    creatorId: '',
    department: '',
    dateRange: {
      start: null,
      end: null
    }
  },
  sort: {
    field: 'createdAt',
    direction: 'desc'
  },
  loading: false,
  myTasksLoading: false,
  statisticsLoading: false,
  error: null,
  lastUpdated: null
};

export const taskReducer = createReducer(
  initialState,
  
  // Load Tasks
  on(loadTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(loadTasksSuccess, (state, { tasks }) => {
    console.log('TaskReducer: loadTasksSuccess received', tasks?.length || 0, 'tasks');
    console.log('TaskReducer: Raw tasks:', tasks);
    
    const sortedTasks = sortTasks(tasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    console.log('TaskReducer: After sorting and filtering - tasks:', sortedTasks?.length, 'filtered:', filteredTasks?.length);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    };
  }),
  
  on(loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Task
  on(createTask, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(createTaskSuccess, (state, { task }) => {
    const updatedTasks = [...state.tasks, task];
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  
  on(createTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Task
  on(updateTask, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(updateTaskSuccess, (state, { task }) => {
    const updatedTasks = state.tasks.map(t => t.id === task.id ? task : t);
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  
  on(updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Task
  on(deleteTask, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(deleteTaskSuccess, (state, { taskId }) => {
    const updatedTasks = state.tasks.filter(t => t.id !== taskId);
    const filteredTasks = applyFilters(updatedTasks, state.filters);
    
    return {
      ...state,
      tasks: updatedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  
  on(deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Filters
  on(setTaskFilters, (state, { filters }) => {
    const newFilters = { ...state.filters, ...filters };
    const filteredTasks = applyFilters(state.tasks, newFilters);
    
    return {
      ...state,
      filters: newFilters,
      filteredTasks
    };
  }),
  
  on(clearTaskFilters, (state) => {
    const filteredTasks = applyFilters(state.tasks, initialState.filters);
    
    return {
      ...state,
      filters: initialState.filters,
      filteredTasks
    };
  }),
  
  // Sort
  on(setTaskSort, (state, { sort }) => {
    const sortedTasks = sortTasks(state.tasks, sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      sort,
      tasks: sortedTasks,
      filteredTasks
    };
  }),
  
  // Bulk Actions
  on(bulkUpdateTasks, (state, { taskIds, updates }) => {
    const updatedTasks = state.tasks.map(task => 
      taskIds.includes(task.id) 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    );
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks
    };
  }),
  
  // Bulk Delete Tasks
  on(bulkDeleteTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(bulkDeleteTasksSuccess, (state, { taskIds }) => {
    const updatedTasks = state.tasks.filter(task => !taskIds.includes(task.id));
    const filteredTasks = applyFilters(updatedTasks, state.filters);
    
    return {
      ...state,
      tasks: updatedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  
  on(bulkDeleteTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Bulk Update Task Status
  on(bulkUpdateTaskStatus, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(bulkUpdateTaskStatusSuccess, (state, { tasks }) => {
    const updatedTasks = state.tasks.map(existingTask => {
      const updatedTask = tasks.find(t => t.id === existingTask.id);
      return updatedTask || existingTask;
    });
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  
  on(bulkUpdateTaskStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // My Tasks Reducers
  on(loadMyTasks, (state) => ({
    ...state,
    myTasksLoading: true,
    error: null
  })),
  on(loadMyTasksSuccess, (state, { tasks }) => ({
    ...state,
    myTasks: tasks,
    myTasksLoading: false,
    error: null
  })),
  on(loadMyTasksFailure, (state, { error }) => ({
    ...state,
    myTasksLoading: false,
    error
  })),

  // Task Statistics Reducers
  on(loadTaskStatistics, (state) => ({
    ...state,
    statisticsLoading: true,
    error: null
  })),
  on(loadTaskStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    statistics,
    statisticsLoading: false,
    error: null
  })),
  on(loadTaskStatisticsFailure, (state, { error }) => ({
    ...state,
    statisticsLoading: false,
    error
  })),

  // Move Task to Department Reducers
  on(moveTaskToDepartment, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(moveTaskToDepartmentSuccess, (state, { task }) => {
    const updatedTasks = state.tasks.map(t => t.id === task.id ? task : t);
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  on(moveTaskToDepartmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Assign Task Reducers
  on(assignTask, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(assignTaskSuccess, (state, { task }) => {
    const updatedTasks = state.tasks.map(t => t.id === task.id ? task : t);
    const sortedTasks = sortTasks(updatedTasks, state.sort);
    const filteredTasks = applyFilters(sortedTasks, state.filters);
    
    return {
      ...state,
      tasks: sortedTasks,
      filteredTasks,
      loading: false,
      error: null
    };
  }),
  on(assignTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

// Helper functions
function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    // Search term filter
    const matchesSearch = !filters.searchTerm || 
      task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = !filters.category || task.category === filters.category;
    
    // Status filter
    const matchesStatus = !filters.status || task.status === filters.status;
    
    // Priority filter
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    
    // Assignee filter
    const matchesAssignee = !filters.assigneeId || task.assigneeId === filters.assigneeId;
    
    // Creator filter
    const matchesCreator = !filters.creatorId || task.creatorId === filters.creatorId;
    
    // Department filter
    const matchesDepartment = !filters.department || task.department === filters.department;
    
    // Date range filter
    const matchesDateRange = !filters.dateRange.start || !filters.dateRange.end ||
      (task.dueDate && 
       new Date(task.dueDate) >= filters.dateRange.start && 
       new Date(task.dueDate) <= filters.dateRange.end);
    
    return matchesSearch && matchesCategory && matchesStatus && 
           matchesPriority && matchesAssignee && matchesCreator && matchesDepartment && matchesDateRange;
  });
}

function sortTasks(tasks: Task[], sort: TaskSortOptions): Task[] {
  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sort.field) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'priority': {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      }
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status': {
        const statusOrder = { 'to-do': 1, started: 2, ongoing: 3, completed: 4 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
        break;
      }
      default:
        return 0;
    }
    
    if (sort.direction === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}