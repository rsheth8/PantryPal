import { User } from '../types';
import {
  isDevMode,
  getCurrentDevUser,
  initializeDevUser,
} from '../config/dev';
import { supabase } from '../lib/supabaseClient';

export function getAuthErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Something went wrong. Please try again.';

  if (message.toLowerCase().includes('email rate limit exceeded')) {
    return (
      'Too many sign-up attempts. Supabase limits how many emails can be sent per hour.\n\n' +
      '• Wait about an hour, then try again\n' +
      '• Or sign in if you already created an account\n' +
      '• In Supabase Dashboard → Authentication → Providers → Email, turn OFF "Confirm email" to avoid emails on signup'
    );
  }

  if (message.toLowerCase().includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password. If you just signed up, confirm your email first.';
  }

  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the Supabase confirmation link.';
  }

  return message;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async initialize(): Promise<void> {
    if (isDevMode()) {
      console.log('DEV MODE: Automatically authenticating');
      await initializeDevUser();
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = this.mapSupabaseUser(session.user);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  private mapSupabaseUser(user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string; avatar?: string };
    created_at?: string;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar: user.user_metadata?.avatar,
      provider: 'email',
      createdAt: user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) return null;

      const authUser = this.mapSupabaseUser(data.user);
      this.currentUser = authUser;
      return authUser;
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;
      if (!data.user) return null;

      if (!data.session) {
        const confirmationError = new Error(
          'Account created! Please check your email to confirm your account, then sign in.'
        ) as Error & { code?: string };
        confirmationError.code = 'EMAIL_CONFIRMATION_REQUIRED';
        throw confirmationError;
      }

      const authUser = this.mapSupabaseUser(data.user);
      this.currentUser = authUser;
      return authUser;
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (isDevMode()) {
      console.log('DEV MODE: Returning test user');
      const devUser = getCurrentDevUser();
      return {
        id: devUser.id,
        email: devUser.email,
        name: devUser.name,
        avatar: devUser.avatar,
        provider: 'email',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const authUser = this.mapSupabaseUser(user);
      this.currentUser = authUser;
      return authUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (isDevMode()) {
      console.log('DEV MODE: Bypassing authentication');
      return true;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session !== null;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  async updateUserProfile(
    updates: Partial<AuthUser>
  ): Promise<AuthUser | null> {
    if (!this.currentUser) return null;
    this.currentUser = { ...this.currentUser, ...updates };
    return this.currentUser;
  }

  convertToUser(authUser: AuthUser): User {
    return {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      avatar: authUser.avatar,
      created_at: authUser.createdAt,
      last_active: authUser.lastLogin,
    };
  }
}

export const authService = new AuthService();
