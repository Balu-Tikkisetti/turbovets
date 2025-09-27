import { TestBed } from '@angular/core/testing';
import { TasksComponent } from './tasks.component';

describe('TasksComponent', () => {
  let component: TasksComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TasksComponent]
    });
    component = TestBed.createComponent(TasksComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have tasks property', () => {
    expect(component.tasks).toBeDefined();
  });

  it('should have canEditTask method', () => {
    expect(typeof component.canEditTask).toBe('function');
  });
});
