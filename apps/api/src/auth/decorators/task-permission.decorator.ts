import { SetMetadata } from '@nestjs/common';
import { TaskPermission, TASK_PERMISSION_KEY } from '../guards/task.guard';

export const RequireTaskPermission = (permission: TaskPermission) => 
  SetMetadata(TASK_PERMISSION_KEY, permission);

// Convenience decorators for common task actions
export const RequireTaskEdit = (requireOwnership: boolean = false) => 
  RequireTaskPermission({ action: 'edit', requireOwnership });

export const RequireTaskDelete = (requireOwnership: boolean = false) => 
  RequireTaskPermission({ action: 'delete', requireOwnership });

export const RequireTaskReassign = () => 
  RequireTaskPermission({ action: 'reassign' });
