/**
 * Minimal user data for session storage
 * Contains only essential information needed for authentication and authorization
 */
export interface UserSession {
  id: string;
  username: string;
  role: string;
  department?: string;
}

/**
 * Complete user data for application state
 * Contains all user information but not stored in session storage
 */
export interface UserProfile extends UserSession {
  email?: string;
  lastLoginAt?: string;
  // Add other non-sensitive user data as needed
}
