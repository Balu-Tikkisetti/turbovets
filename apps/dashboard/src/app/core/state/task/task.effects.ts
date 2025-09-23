import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { 
  loadTasks, 
  loadTasksSuccess,
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
  bulkUpdateTasks,
  bulkUpdateTasksSuccess,
  bulkUpdateTasksFailure,
  bulkDeleteTasks,
  bulkDeleteTasksSuccess,
  bulkDeleteTasksFailure,
  bulkUpdateTaskStatus,
  bulkUpdateTaskStatusSuccess,
  bulkUpdateTaskStatusFailure
} from './task.actions';
import { CreateTaskDto, UpdateTaskDto } from '@turbovets/data';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);
  private store = inject(Store);

  // Load Tasks Effect
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      tap(() => console.log('TaskEffects: loadTasks action dispatched')),
      switchMap(() => {
        console.log('TaskEffects: Calling taskService.getTasks()');
        return this.taskService.getTasks().pipe(
          tap(tasks => console.log('TaskEffects: Tasks received from service:', tasks?.length || 0)),
          map(tasks => {
            console.log('TaskEffects: Dispatching loadTasksSuccess with', tasks?.length || 0, 'tasks');
            return loadTasksSuccess({ tasks });
          }),
          catchError(error => {
            console.error('TaskEffects: Failed to load tasks:', error);
            // Don't let the error break the app - return empty tasks
            return of(loadTasksSuccess({ tasks: [] }));
          })
        );
      })
    )
  );

  // Create Task Effect
  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createTask),
      switchMap(({ task }) =>
        this.taskService.createTask(task as unknown as CreateTaskDto).pipe(
          map(createdTask => createTaskSuccess({ task: createdTask })),
          catchError(error => of(createTaskFailure({ error: error.error?.message || error.message || 'Failed to create task' })))
        )
      )
    )
  );

  // Update Task Effect
  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateTask),
      switchMap(({ taskId, updates }) =>
        this.taskService.updateTask(taskId, updates as UpdateTaskDto).pipe(
          map(updatedTask => updateTaskSuccess({ task: updatedTask })),
          catchError(error => of(updateTaskFailure({ error: error.error?.message || error.message || 'Failed to update task' })))
        )
      )
    )
  );

  // Delete Task Effect
  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTask),
      switchMap(({ taskId }) =>
        this.taskService.deleteTask(taskId).pipe(
          map(() => deleteTaskSuccess({ taskId })),
          catchError(error => of(deleteTaskFailure({ error: error.error?.message || error.message || 'Failed to delete task' })))
        )
      )
    )
  );

  // Move Task to Department Effect
  moveTaskToDepartment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(moveTaskToDepartment),
      switchMap(({ taskId, department }) =>
        this.taskService.moveTaskToDepartment(taskId, department).pipe(
          map(updatedTask => moveTaskToDepartmentSuccess({ task: updatedTask })),
          catchError(error => of(moveTaskToDepartmentFailure({ error: error.error?.message || error.message || 'Failed to move task' })))
        )
      )
    )
  );

  // Bulk Update Tasks Effect
  bulkUpdateTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(bulkUpdateTasks),
      switchMap(({ taskIds, updates }) =>
        this.taskService.bulkUpdateTasks(taskIds, updates).pipe(
          map(tasks => bulkUpdateTasksSuccess({ tasks })),
          catchError(error => of(bulkUpdateTasksFailure({ error: error.error?.message || error.message || 'Failed to update tasks' })))
        )
      )
    )
  );

  // Bulk Delete Tasks Effect
  bulkDeleteTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(bulkDeleteTasks),
      switchMap(({ taskIds }) =>
        this.taskService.bulkDeleteTasks(taskIds).pipe(
          map(() => bulkDeleteTasksSuccess({ taskIds })),
          catchError(error => of(bulkDeleteTasksFailure({ error: error.error?.message || error.message || 'Failed to delete tasks' })))
        )
      )
    )
  );

  // Bulk Update Task Status Effect
  bulkUpdateTaskStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(bulkUpdateTaskStatus),
      switchMap(({ taskIds, status }) =>
        this.taskService.bulkUpdateTaskStatus(taskIds, status).pipe(
          map(tasks => bulkUpdateTaskStatusSuccess({ tasks })),
          catchError(error => of(bulkUpdateTaskStatusFailure({ error: error.error?.message || error.message || 'Failed to update task status' })))
        )
      )
    )
  );
}