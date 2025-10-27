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

  assignTask,
  assignTaskSuccess,
  assignTaskFailure,


} from './mytask.actions';
import { CreateTaskDto, UpdateTaskDto } from '@turbovets/data';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);
  private store = inject(Store);
  private statisticService = inject(StatisticsService);
  // Load organization level all Work Tasks Effect
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      tap(),
      switchMap((action) => {
        const page = action.page || 1;
        const limit = action.limit || 25;
        
        return this.taskService.getWorkTasks(page, limit).pipe(
          tap(),
          map(response => {
            return loadTasksSuccess({ 
              tasks: response.tasks,
              total: response.total,
              page: response.page,
              totalPages: response.totalPages,
              hasNext: response.hasNext
            });
          }),
          catchError(error => {
            console.error('TaskEffects: Failed to load work tasks:', error);
            // Don't let the error break the app - return empty tasks
            return of(loadTasksSuccess({ 
              tasks: [],
              total: 0,
              page: 1,
              totalPages: 0,
              hasNext: false
            }));
          })
        );
      })
    )
  );

  loadMyTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMyTasks),
      switchMap((action) => {
        const page = action.page || 1;
        const limit = action.limit || 10;

        return this.taskService.getMyTasks(page, limit).pipe(
          tap(),
          map(response => {
            return loadMyTasksSuccess({ 
              tasks: response.tasks,
              total: response.total,
              page: response.page,
              totalPages: response.totalPages,
              hasNext: response.hasNext
            });
          }),
          catchError(error => {
            console.error('TaskEffects: Failed to load my tasks:', error);
            return of(loadMyTasksFailure({ error: error.error?.message || error.message || 'Failed to load my tasks' }));
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
      switchMap(({ taskId}) =>
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