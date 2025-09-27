import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { StatisticsService } from '../../services/statistics.service';
import { 
  loadTasks, 
  loadTasksSuccess,
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
  private statisticService = inject(StatisticsService);
  // Load Work Tasks Effect
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      tap(),
      switchMap(() => {
        
        return this.taskService.getWorkTasks().pipe(
          tap(),
          map(tasks => {
            return loadTasksSuccess({ tasks });
          }),
          catchError(error => {
            console.error('TaskEffects: Failed to load work tasks:', error);
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



  // Assign Task Effect
  assignTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(assignTask),
      switchMap(({ taskId, assigneeId }) =>
        this.taskService.assignTask(taskId, assigneeId).pipe(
          map(updatedTask => assignTaskSuccess({ task: updatedTask })),
          catchError(error => of(assignTaskFailure({ error: error.error?.message || error.message || 'Failed to assign task' })))
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

  // Load My Tasks Effect
  loadMyTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMyTasks),
      switchMap(() =>
        this.taskService.getMyTasks().pipe(
          map(tasks => loadMyTasksSuccess({ tasks })),
          catchError(error => of(loadMyTasksFailure({ error: error.error?.message || error.message || 'Failed to load my tasks' })))
        )
      )
    )
  );

  // Load Task Statistics Effect
  loadTaskStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTaskStatistics),
      switchMap(() =>
        this.statisticService.getTaskStatistics().pipe(
          map(statistics => loadTaskStatisticsSuccess({ statistics })),
          catchError(error => of(loadTaskStatisticsFailure({ error: error.error?.message || error.message || 'Failed to load task statistics' })))
        )
      )
    )
  );

  // Statistics will be updated via polling in the component
}