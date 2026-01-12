/**
 * Core application types
 */

export type UserRole = 'admin' | 'developer' | 'tester' | 'designer';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
}

export interface Session {
  user: SessionUser;
}
