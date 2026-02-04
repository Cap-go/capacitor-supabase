import { WebPlugin } from '@capacitor/core';

import type {
  AuthResult,
  AuthStateChange,
  CapacitorSupabasePlugin,
  DeleteOptions,
  InsertOptions,
  QueryResult,
  SelectOptions,
  Session,
  SetSessionOptions,
  SignInWithOAuthOptions,
  SignInWithOtpOptions,
  SignInWithPasswordOptions,
  SignUpOptions,
  SupabaseConfig,
  UpdateOptions,
  User,
  VerifyOtpOptions,
} from './definitions';

export class CapacitorSupabaseWeb extends WebPlugin implements CapacitorSupabasePlugin {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initialize(_options: SupabaseConfig): Promise<void> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signInWithPassword(_options: SignInWithPasswordOptions): Promise<AuthResult> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signUp(_options: SignUpOptions): Promise<AuthResult> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async signInAnonymously(): Promise<AuthResult> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signInWithOAuth(_options: SignInWithOAuthOptions): Promise<void> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signInWithOtp(_options: SignInWithOtpOptions): Promise<void> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifyOtp(_options: VerifyOtpOptions): Promise<AuthResult> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async signOut(): Promise<void> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async getSession(): Promise<{ session: Session | null }> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async refreshSession(): Promise<{ session: Session | null }> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async getUser(): Promise<{ user: User | null }> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setSession(_options: SetSessionOptions): Promise<{ session: Session | null }> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async select<T = unknown>(_options: SelectOptions): Promise<QueryResult<T[]>> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async insert<T = unknown>(_options: InsertOptions): Promise<QueryResult<T>> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update<T = unknown>(_options: UpdateOptions): Promise<QueryResult<T>> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete<T = unknown>(_options: DeleteOptions): Promise<QueryResult<T>> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  override async addListener(
    _eventName: 'authStateChange',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _listenerFunc: (data: AuthStateChange) => void,
  ): Promise<{ remove: () => Promise<void> }> {
    throw new Error('Web implementation not available. Use @supabase/supabase-js directly for web.');
  }

  async getPluginVersion(): Promise<{ version: string }> {
    return { version: 'web' };
  }
}
