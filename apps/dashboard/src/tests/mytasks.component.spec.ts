import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksComponent } from '../app/features/mytasks/mytasks.component';
import { provideMockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Task, TaskStatus, TaskPriority, TaskCategory, UserDto, Role } from '@turbovets/data';

describe('TasksComponent (MyTasks)', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let store: Store;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: TaskStatus.ToDo,
      priority: TaskPriority.High,
      category: TaskCategory.Work,
      creatorId: '1',
      dueDate: new Date(),
      recurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      status: TaskStatus.Completed,
      priority: TaskPriority.Low,
      category: TaskCategory.Personal,
      creatorId: '2',
      recurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockInitialState = {
    mytask: {
      myTasks: mockTasks,
      filteredTasks: [],
      filters: {},
      loading: false,
      error: null
    },
    auth: {
      currentUser: {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        role: Role.Admin,
        department: 'IT'
      } as UserDto
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideMockStore({ initialState: mockInitialState }),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create component and initialize state', () => {
    expect(component).toBeTruthy();
    expect(component.viewMode).toBe('list');
    expect(component.showFilters).toBe(false);
    expect(component.filters).toBeDefined();
  });

  it('should toggle view mode correctly', () => {
    expect(component.viewMode).toBe('list');
    
    component.setViewMode('kanban');
    expect(component.viewMode).toBe('kanban');
    
    component.setViewMode('grid');
    expect(component.viewMode).toBe('grid');
  });

  it('should toggle filters panel', () => {
    expect(component.showFilters).toBe(false);
    
    component.toggleFilters();
    expect(component.showFilters).toBe(true);
    
    component.toggleFilters();
    expect(component.showFilters).toBe(false);
  });

  it('should clear task filters', () => {
    component.filters.searchTerm = 'test';
    component.filters.category = TaskCategory.Work as any;
    
    component.clearFilters();
    
    expect(component.filters.searchTerm).toBe('');
    expect(component.filters.category).toBe('');
  });

  it('should get priority color correctly', () => {
    expect(component.getPriorityColor(TaskPriority.Critical)).toBe('red');
    expect(component.getPriorityColor(TaskPriority.High)).toBe('orange');
    expect(component.getPriorityColor(TaskPriority.Medium)).toBe('yellow');
    expect(component.getPriorityColor(TaskPriority.Low)).toBe('green');
  });

  it('should get status color correctly', () => {
    expect(component.getStatusColor(TaskStatus.ToDo)).toBe('gray');
    expect(component.getStatusColor(TaskStatus.Started)).toBe('blue');
    expect(component.getStatusColor(TaskStatus.Completed)).toBe('green');
  });
});

