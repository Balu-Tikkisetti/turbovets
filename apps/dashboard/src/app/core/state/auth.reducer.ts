import { createAction, createReducer, on, createSelector, createFeatureSelector } from '@ngrx/store';
import { UserSession, UserProfile } from '@turbovets/data';

export interface AuthState {
  user: UserProfile | null;
  session: UserSession | null;
  isLoggedIn: boolean;
}

const getInitialState = (): AuthState => {
  try {
    const sessionString = sessionStorage.getItem('userSession');
    if (sessionString) {
      const session: UserSession = JSON.parse(sessionString);
      return { 
        user: null, // Full user data not stored in session storage
        session, 
        isLoggedIn: true 
      };
    }
  } catch (e) {
    console.error('Could not load session from sessionStorage', e);
  }
  return { user: null, session: null, isLoggedIn: false };
};

export const initialState: AuthState = getInitialState();

export const loginSuccess = createAction(
  '[Auth] Login Success',
  (user: UserProfile, session: UserSession) => ({ user, session })
);

export const logout = createAction('[Auth] Logout');

export const updateCurrentUser = createAction(
  '[Auth] Update Current User',
  (user: UserProfile) => ({ user })
);

export const updateSession = createAction(
  '[Auth] Update Session',
  (session: UserSession) => ({ session })
);

export const checkSessionTimeout = createAction(
  '[Auth] Check Session Timeout'
);

export const authReducer = createReducer(
  initialState,
  on(loginSuccess, (state, { user, session }) => {
    // Store only minimal session data in sessionStorage
    sessionStorage.setItem('userSession', JSON.stringify(session));
    return { ...state, user, session, isLoggedIn: true };
  }),
  on(updateCurrentUser, (state, { user }) => {
    // Update user data but don't store in session storage
    return { ...state, user, isLoggedIn: true };
  }),
  on(updateSession, (state, { session }) => {
    // Update session data and store in session storage
    sessionStorage.setItem('userSession', JSON.stringify(session));
    return { ...state, session };
  }),
  on(checkSessionTimeout, (state) => {
    // Check if session has timed out (30 minutes of inactivity)
    const session = state.session;
    if (session) {
      const now = Date.now();
      const lastActivity = sessionStorage.getItem('lastActivity');
      
      if (lastActivity) {
        const timeSinceActivity = now - parseInt(lastActivity, 10);
        const timeout = 30 * 60 * 1000; // 30 minutes
        
        if (timeSinceActivity > timeout) {
          sessionStorage.removeItem('userSession');
          sessionStorage.removeItem('lastActivity');
          return { user: null, session: null, isLoggedIn: false };
        }
      }
    }
    return state;
  }),
  on(logout, (state) => {
    sessionStorage.removeItem('userSession');
    return { ...state, user: null, session: null, isLoggedIn: false };
  })
);

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectUserSession = createSelector(
  selectAuthState,
  (state: AuthState) => state.session
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoggedIn
);

// Combined selector for backward compatibility
export const selectCurrentUserOrSession = createSelector(
  selectCurrentUser,
  selectUserSession,
  (user, session) => user || session
);