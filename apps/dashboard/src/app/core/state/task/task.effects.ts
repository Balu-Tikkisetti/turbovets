import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import * as TaskActions from './task.actions';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);

  // This effect would interact with your backend API
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      mergeMap(() =>
        of([]).pipe( // Replace with your service call, e.g., this.taskService.getTasks()
          map(tasks => TaskActions.loadTasksSuccess({ tasks })),
          catchError(error => of(TaskActions.loadTasksFailure({ error })))
        )
      )
    )
  );

  createNewTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.createNewTask),
      mergeMap(action =>
        of(action.task).pipe( // Replace with your service call, e.g., this.taskService.createTask(action.task)
          tap(task => console.log('Task created on backend:', task)),
          map(task => TaskActions.createNewTaskSuccess({ task })),
          catchError(error => of(TaskActions.createNewTaskFailure({ error })))
        )
      )
    )
  );
  
  // Effects for updateTask would go here as well
}