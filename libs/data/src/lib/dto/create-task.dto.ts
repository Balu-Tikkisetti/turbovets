import { TaskCategory, TaskPriority, TaskStatus } from '../enums/task.enum';

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  category: TaskCategory;
  department?: string;
  startDate?: string;
  startTime?: string;
  dueDate: string;
  dueTime?: string;
  recurring: boolean;
  assigneeId?: string;
}
