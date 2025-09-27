export interface TaskStatistics {
  totalWorkTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
  tasksByDepartment: { [department: string]: number };
  tasksByStatus: { [status: string]: number };
  tasksByPriority: { [priority: string]: number };
  weeklyTasks?: { [day: string]: number };
}

export interface DepartmentStatistics {
  department: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  averageTasksPerUser: number;
}

export interface PersonalTaskStatistics {
  totalPersonalTasks: number;
  completedPersonalTasks: number;
  pendingPersonalTasks: number;
  personalTasksByStatus: { [status: string]: number };
  personalTasksByPriority: { [priority: string]: number };
}
