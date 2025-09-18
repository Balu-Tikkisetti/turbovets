import { createAction, createReducer, on, createSelector, createFeatureSelector } from '@ngrx/store';
import { UserDto } from 'libs/data/src/lib/dto/user.dto';

export interface AuthState {
  user: UserDto | null;
  isLoggedIn: boolean;
}

const getInitialState = (): AuthState => {
  try {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user: UserDto = JSON.parse(userString);
      return { user, isLoggedIn: true };
    }
  } catch (e) {
    console.error('Could not load user from localStorage', e);
  }
  return { user: null, isLoggedIn: false };
};

export const initialState: AuthState = getInitialState();

export const loginSuccess = createAction(
  '[Auth] Login Success',
  (user: UserDto) => ({ user })
);

export const logout = createAction('[Auth] Logout');

export const authReducer = createReducer(
  initialState,
  on(loginSuccess, (state, { user }) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { ...state, user, isLoggedIn: true };
  }),
  on(logout, (state) => {
    localStorage.removeItem('currentUser');
    return { ...state, user: null, isLoggedIn: false };
  })
);

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoggedIn
);