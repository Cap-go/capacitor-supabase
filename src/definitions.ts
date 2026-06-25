import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Configuration options for initializing the Supabase client.
 *
 * @since 0.0.1
 */
export interface SupabaseConfig {
  /**
   * The Supabase project URL.
   *
   * @since 0.0.1
   * @example "https://xyzcompany.supabase.co"
   */
  supabaseUrl: string;

  /**
   * The Supabase anonymous/public key.
   *
   * @since 0.0.1
   */
  supabaseKey: string;
}

/**
 * User object returned from authentication operations.
 *
 * @since 0.0.1
 */
export interface User {
  /**
   * Unique identifier for the user.
   *
   * @since 0.0.1
   */
  id: string;

  /**
   * User's email address.
   *
   * @since 0.0.1
   */
  email?: string;

  /**
   * User's phone number.
   *
   * @since 0.0.1
   */
  phone?: string;

  /**
   * Timestamp when the user was created.
   *
   * @since 0.0.1
   */
  createdAt?: string;

  /**
   * Timestamp when the user last signed in.
   *
   * @since 0.0.1
   */
  lastSignInAt?: string;

  /**
   * User metadata (custom fields).
   *
   * @since 0.0.1
   */
  userMetadata?: Record<string, unknown>;

  /**
   * App metadata.
   *
   * @since 0.0.1
   */
  appMetadata?: Record<string, unknown>;
}

/**
 * Session object containing authentication tokens.
 *
 * @since 0.0.1
 */
export interface Session {
  /**
   * The JWT access token. Use this for authenticated API requests.
   *
   * @since 0.0.1
   */
  accessToken: string;

  /**
   * The refresh token for obtaining new access tokens.
   *
   * @since 0.0.1
   */
  refreshToken: string;

  /**
   * Token type (usually "bearer").
   *
   * @since 0.0.1
   */
  tokenType: string;

  /**
   * Number of seconds until the access token expires.
   *
   * @since 0.0.1
   */
  expiresIn: number;

  /**
   * Unix timestamp when the token expires.
   *
   * @since 0.0.1
   */
  expiresAt?: number;

  /**
   * The authenticated user.
   *
   * @since 0.0.1
   */
  user: User;
}

/**
 * Result of authentication operations that return a session.
 *
 * @since 0.0.1
 */
export interface AuthResult {
  /**
   * The session if authentication was successful.
   *
   * @since 0.0.1
   */
  session: Session | null;

  /**
   * The authenticated user if successful.
   *
   * @since 0.0.1
   */
  user: User | null;
}

/**
 * Options for email/password sign-in.
 *
 * @since 0.0.1
 */
export interface SignInWithPasswordOptions {
  /**
   * User's email address.
   *
   * @since 0.0.1
   */
  email: string;

  /**
   * User's password.
   *
   * @since 0.0.1
   */
  password: string;
}

/**
 * Options for email/password sign-up.
 *
 * @since 0.0.1
 */
export interface SignUpOptions {
  /**
   * User's email address.
   *
   * @since 0.0.1
   */
  email: string;

  /**
   * User's password.
   *
   * @since 0.0.1
   */
  password: string;

  /**
   * Optional user metadata to store with the user.
   *
   * @since 0.0.1
   */
  data?: Record<string, unknown>;
}

/**
 * Options for OAuth sign-in.
 *
 * @since 0.0.1
 */
export interface SignInWithOAuthOptions {
  /**
   * The OAuth provider to use.
   *
   * @since 0.0.1
   */
  provider: OAuthProvider;

  /**
   * URL to redirect to after authentication.
   *
   * @since 0.0.1
   */
  redirectTo?: string;

  /**
   * OAuth scopes to request.
   *
   * @since 0.0.1
   */
  scopes?: string;
}

/**
 * Supported OAuth providers.
 *
 * @since 0.0.1
 */
export type OAuthProvider =
  | 'apple'
  | 'azure'
  | 'bitbucket'
  | 'discord'
  | 'facebook'
  | 'figma'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'kakao'
  | 'keycloak'
  | 'linkedin'
  | 'linkedin_oidc'
  | 'notion'
  | 'slack'
  | 'slack_oidc'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'workos'
  | 'zoom';

/**
 * Options for OTP sign-in.
 *
 * @since 0.0.1
 */
export interface SignInWithOtpOptions {
  /**
   * User's email address (required if phone is not provided).
   *
   * @since 0.0.1
   */
  email?: string;

  /**
   * User's phone number (required if email is not provided).
   *
   * @since 0.0.1
   */
  phone?: string;
}

/**
 * Options for verifying OTP.
 *
 * @since 0.0.1
 */
export interface VerifyOtpOptions {
  /**
   * User's email address (required if phone is not provided).
   *
   * @since 0.0.1
   */
  email?: string;

  /**
   * User's phone number (required if email is not provided).
   *
   * @since 0.0.1
   */
  phone?: string;

  /**
   * The OTP token received via email/SMS.
   *
   * @since 0.0.1
   */
  token: string;

  /**
   * The type of OTP verification.
   *
   * @since 0.0.1
   */
  type: 'sms' | 'email' | 'magiclink' | 'signup' | 'recovery';
}

/**
 * Options for setting a session manually.
 *
 * @since 0.0.1
 */
export interface SetSessionOptions {
  /**
   * The access token.
   *
   * @since 0.0.1
   */
  accessToken: string;

  /**
   * The refresh token.
   *
   * @since 0.0.1
   */
  refreshToken: string;
}

/**
 * Auth state change event types.
 *
 * @since 0.0.1
 */
export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

/**
 * Auth state change callback data.
 *
 * @since 0.0.1
 */
export interface AuthStateChange {
  /**
   * The type of auth event.
   *
   * @since 0.0.1
   */
  event: AuthChangeEvent;

  /**
   * The current session (null if signed out).
   *
   * @since 0.0.1
   */
  session: Session | null;
}

/**
 * Options for database select queries.
 *
 * @since 0.0.1
 */
export interface SelectOptions {
  /**
   * The table name to query.
   *
   * @since 0.0.1
   */
  table: string;

  /**
   * Columns to select (default: "*").
   *
   * @since 0.0.1
   */
  columns?: string;

  /**
   * Filter conditions as key-value pairs.
   *
   * @since 0.0.1
   */
  filter?: Record<string, unknown>;

  /**
   * Maximum number of rows to return.
   *
   * @since 0.0.1
   */
  limit?: number;

  /**
   * Number of rows to skip.
   *
   * @since 0.0.1
   */
  offset?: number;

  /**
   * Column to order by.
   *
   * @since 0.0.1
   */
  orderBy?: string;

  /**
   * Order direction.
   *
   * @since 0.0.1
   */
  ascending?: boolean;

  /**
   * Return a single row instead of an array.
   *
   * @since 0.0.1
   */
  single?: boolean;
}

/**
 * Options for database insert queries.
 *
 * @since 0.0.1
 */
export interface InsertOptions {
  /**
   * The table name to insert into.
   *
   * @since 0.0.1
   */
  table: string;

  /**
   * The data to insert (single object or array of objects).
   *
   * @since 0.0.1
   */
  values: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Options for database update queries.
 *
 * @since 0.0.1
 */
export interface UpdateOptions {
  /**
   * The table name to update.
   *
   * @since 0.0.1
   */
  table: string;

  /**
   * The data to update.
   *
   * @since 0.0.1
   */
  values: Record<string, unknown>;

  /**
   * Filter conditions to match rows to update.
   *
   * @since 0.0.1
   */
  filter: Record<string, unknown>;
}

/**
 * Options for database delete queries.
 *
 * @since 0.0.1
 */
export interface DeleteOptions {
  /**
   * The table name to delete from.
   *
   * @since 0.0.1
   */
  table: string;

  /**
   * Filter conditions to match rows to delete.
   *
   * @since 0.0.1
   */
  filter: Record<string, unknown>;
}

/**
 * Result of database queries.
 *
 * @since 0.0.1
 */
export interface QueryResult<T = unknown> {
  /**
   * The query result data.
   *
   * @since 0.0.1
   */
  data: T | null;

  /**
   * Error message if the query failed.
   *
   * @since 0.0.1
   */
  error: string | null;

  /**
   * Number of affected rows (for insert/update/delete).
   *
   * @since 0.0.1
   */
  count?: number;
}

/**
 * Capacitor Supabase Plugin for native Supabase SDK integration.
 *
 * This plugin provides native iOS and Android Supabase SDK functionality
 * with the ability to retrieve JWT tokens for use in JavaScript/web layers.
 *
 * @since 0.0.1
 */
export interface CapacitorSupabasePlugin {
  /**
   * Initialize the Supabase client with your project credentials.
   * Must be called before any other methods.
   *
   * @param options - Configuration options including URL and API key
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   * @since 0.0.1
   * @example
   * ```typescript
   * await CapacitorSupabase.initialize({
   *   supabaseUrl: 'https://xyzcompany.supabase.co',
   *   supabaseKey: 'your-anon-key'
   * });
   * ```
   */
  initialize(options: SupabaseConfig): Promise<void>;

  /**
   * Sign in with email and password.
   *
   * @param options - Email and password credentials
   * @returns Promise with session and user data
   * @throws Error if sign-in fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session, user } = await CapacitorSupabase.signInWithPassword({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   * console.log('JWT:', session?.accessToken);
   * ```
   */
  signInWithPassword(options: SignInWithPasswordOptions): Promise<AuthResult>;

  /**
   * Sign up a new user with email and password.
   *
   * @param options - Email, password, and optional user metadata
   * @returns Promise with session and user data
   * @throws Error if sign-up fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session, user } = await CapacitorSupabase.signUp({
   *   email: 'newuser@example.com',
   *   password: 'password123',
   *   data: { name: 'John Doe' }
   * });
   * ```
   */
  signUp(options: SignUpOptions): Promise<AuthResult>;

  /**
   * Sign in anonymously.
   * Creates a temporary guest session without requiring credentials.
   *
   * @returns Promise with session and user data
   * @throws Error if anonymous sign-in fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session, user } = await CapacitorSupabase.signInAnonymously();
   * console.log('Anonymous user ID:', user?.id);
   * ```
   */
  signInAnonymously(): Promise<AuthResult>;

  /**
   * Sign in with an OAuth provider.
   * Opens the provider's authentication page.
   *
   * @param options - OAuth provider and optional redirect URL
   * @returns Promise that resolves when OAuth flow is initiated
   * @throws Error if OAuth sign-in fails
   * @since 0.0.1
   * @example
   * ```typescript
   * await CapacitorSupabase.signInWithOAuth({
   *   provider: 'google',
   *   redirectTo: 'myapp://callback'
   * });
   * ```
   */
  signInWithOAuth(options: SignInWithOAuthOptions): Promise<void>;

  /**
   * Sign in with OTP (One-Time Password) sent via email or SMS.
   *
   * @param options - Email or phone number to send OTP to
   * @returns Promise that resolves when OTP is sent
   * @throws Error if sending OTP fails
   * @since 0.0.1
   * @example
   * ```typescript
   * await CapacitorSupabase.signInWithOtp({
   *   email: 'user@example.com'
   * });
   * ```
   */
  signInWithOtp(options: SignInWithOtpOptions): Promise<void>;

  /**
   * Verify an OTP token.
   *
   * @param options - Email/phone, token, and verification type
   * @returns Promise with session and user data
   * @throws Error if verification fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session, user } = await CapacitorSupabase.verifyOtp({
   *   email: 'user@example.com',
   *   token: '123456',
   *   type: 'email'
   * });
   * ```
   */
  verifyOtp(options: VerifyOtpOptions): Promise<AuthResult>;

  /**
   * Sign out the current user.
   *
   * @returns Promise that resolves when sign-out is complete
   * @throws Error if sign-out fails
   * @since 0.0.1
   * @example
   * ```typescript
   * await CapacitorSupabase.signOut();
   * ```
   */
  signOut(): Promise<void>;

  /**
   * Get the current session if one exists.
   * Returns the session with JWT access token.
   *
   * @returns Promise with the current session or null
   * @throws Error if retrieving session fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session } = await CapacitorSupabase.getSession();
   * if (session) {
   *   console.log('JWT:', session.accessToken);
   *   // Use this token with @supabase/supabase-js
   * }
   * ```
   */
  getSession(): Promise<{ session: Session | null }>;

  /**
   * Refresh the current session and get new tokens.
   *
   * @returns Promise with the refreshed session
   * @throws Error if refresh fails or no session exists
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session } = await CapacitorSupabase.refreshSession();
   * console.log('New JWT:', session?.accessToken);
   * ```
   */
  refreshSession(): Promise<{ session: Session | null }>;

  /**
   * Get the currently authenticated user.
   *
   * @returns Promise with the current user or null
   * @throws Error if retrieving user fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { user } = await CapacitorSupabase.getUser();
   * if (user) {
   *   console.log('User ID:', user.id);
   * }
   * ```
   */
  getUser(): Promise<{ user: User | null }>;

  /**
   * Set the session manually with access and refresh tokens.
   * Useful for restoring a session or integrating with external auth.
   *
   * @param options - Access and refresh tokens
   * @returns Promise with the restored session
   * @throws Error if setting session fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { session } = await CapacitorSupabase.setSession({
   *   accessToken: 'eyJ...',
   *   refreshToken: 'abc123'
   * });
   * ```
   */
  setSession(options: SetSessionOptions): Promise<{ session: Session | null }>;

  /**
   * Listen to authentication state changes.
   *
   * @param eventName - Must be 'authStateChange'
   * @param listenerFunc - Callback function for auth state changes
   * @returns Promise with handle to remove the listener
   * @since 0.0.1
   * @example
   * ```typescript
   * const listener = await CapacitorSupabase.addListener(
   *   'authStateChange',
   *   ({ event, session }) => {
   *     console.log('Auth event:', event);
   *     if (session) {
   *       console.log('JWT:', session.accessToken);
   *     }
   *   }
   * );
   *
   * // Later, remove the listener
   * listener.remove();
   * ```
   */
  addListener(
    eventName: 'authStateChange',
    listenerFunc: (data: AuthStateChange) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for auth state changes.
   *
   * @since 0.0.1
   * @example
   * ```typescript
   * await CapacitorSupabase.removeAllListeners();
   * ```
   */
  removeAllListeners(): Promise<void>;

  /**
   * Execute a SELECT query on a table.
   *
   * @param options - Query options including table, columns, filters
   * @returns Promise with query results
   * @throws Error if query fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { data, error } = await CapacitorSupabase.select({
   *   table: 'users',
   *   columns: 'id, name, email',
   *   filter: { active: true },
   *   limit: 10,
   *   orderBy: 'created_at',
   *   ascending: false
   * });
   * ```
   */
  select<T = unknown>(options: SelectOptions): Promise<QueryResult<T[]>>;

  /**
   * Insert data into a table.
   *
   * @param options - Table name and values to insert
   * @returns Promise with inserted data
   * @throws Error if insert fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { data, error } = await CapacitorSupabase.insert({
   *   table: 'posts',
   *   values: { title: 'Hello', content: 'World' }
   * });
   * ```
   */
  insert<T = unknown>(options: InsertOptions): Promise<QueryResult<T>>;

  /**
   * Update data in a table.
   *
   * @param options - Table name, values to update, and filter conditions
   * @returns Promise with updated data
   * @throws Error if update fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { data, error } = await CapacitorSupabase.update({
   *   table: 'posts',
   *   values: { title: 'Updated Title' },
   *   filter: { id: 1 }
   * });
   * ```
   */
  update<T = unknown>(options: UpdateOptions): Promise<QueryResult<T>>;

  /**
   * Delete data from a table.
   *
   * @param options - Table name and filter conditions
   * @returns Promise with deleted data
   * @throws Error if delete fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { data, error } = await CapacitorSupabase.delete({
   *   table: 'posts',
   *   filter: { id: 1 }
   * });
   * ```
   */
  delete<T = unknown>(options: DeleteOptions): Promise<QueryResult<T>>;

  /**
   * Get the native Capacitor plugin version.
   *
   * @returns Promise that resolves with the plugin version
   * @throws Error if getting the version fails
   * @since 0.0.1
   * @example
   * ```typescript
   * const { version } = await CapacitorSupabase.getPluginVersion();
   * console.log('Plugin version:', version);
   * ```
   */
  getPluginVersion(): Promise<{ version: string }>;
}
