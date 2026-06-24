import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';
import { isDevMode, getCurrentDevUser, initializeDevUser } from '../config/dev';

import { SUPABASE_CONFIG } from '../config/supabase';

const SUPABASE_URL = SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      await initializeDevUser(); // Initialize dev user from storage
      return;
    }
    try {
      // Check for existing session
      const session = await this.getStoredSession();
      if (session) {
        this.currentUser = session;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
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

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || email.split('@')[0],
        avatar: data.user.user_metadata?.avatar,
        provider: 'email',
        createdAt: data.user.created_at,
        lastLogin: new Date().toISOString(),
      };

      await this.storeSession(authUser);
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

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || name,
        avatar: data.user.user_metadata?.avatar,
        provider: 'email',
        createdAt: data.user.created_at,
        lastLogin: new Date().toISOString(),
      };

      await this.storeSession(authUser);
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

      // Clear stored session
      await AsyncStorage.removeItem('auth_session');
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

      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        avatar: user.user_metadata?.avatar,
        provider: 'email',
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
      };

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
    await this.storeSession(this.currentUser);
    return this.currentUser;
  }

  private async storeSession(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_session', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private async getStoredSession(): Promise<AuthUser | null> {
    try {
      const session = await AsyncStorage.getItem('auth_session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  // Convert AuthUser to User (for compatibility with existing User interface)
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
