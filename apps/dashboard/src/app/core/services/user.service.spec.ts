import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have getUsers method', () => {
    expect(typeof service.getUsers).toBe('function');
  });

  it('should have getUser method', () => {
    expect(typeof service.getUser).toBe('function');
  });

  it('should have updateUserRole method', () => {
    expect(typeof service.updateUserRole).toBe('function');
  });

  it('should have getCurrentUserProfile method', () => {
    expect(typeof service.getCurrentUserProfile).toBe('function');
  });
});
