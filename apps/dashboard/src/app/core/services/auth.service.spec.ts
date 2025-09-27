import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have login method', () => {
    expect(typeof service.login).toBe('function');
  });

  it('should have register method', () => {
    expect(typeof service.register).toBe('function');
  });

  it('should have logout method', () => {
    expect(typeof service.logout).toBe('function');
  });

  it('should have isLoggedIn method', () => {
    expect(typeof service.isLoggedIn).toBe('function');
  });

  it('should have getCurrentUser method', () => {
    expect(typeof service.getCurrentUser).toBe('function');
  });
});
