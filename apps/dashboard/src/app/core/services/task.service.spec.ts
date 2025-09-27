import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have getTasks method', () => {
    expect(typeof service.getTasks).toBe('function');
  });

  it('should have getTask method', () => {
    expect(typeof service.getTask).toBe('function');
  });

  it('should have createTask method', () => {
    expect(typeof service.createTask).toBe('function');
  });

  it('should have updateTask method', () => {
    expect(typeof service.updateTask).toBe('function');
  });

  it('should have deleteTask method', () => {
    expect(typeof service.deleteTask).toBe('function');
  });

  it('should have assignTask method', () => {
    expect(typeof service.assignTask).toBe('function');
  });
});
