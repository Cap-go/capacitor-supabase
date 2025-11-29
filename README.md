# @capgo/capacitor-supabase

Native Supabase SDK integration for Capacitor - Auth, Database, and JWT access.

This plugin provides native iOS and Android Supabase SDK functionality with the ability to retrieve JWT tokens for use in JavaScript/web layers.

## Install

```bash
npm install @capgo/capacitor-supabase
npx cap sync
```

## iOS Setup

No additional setup required. The plugin uses Swift Package Manager to include the Supabase Swift SDK.

## Android Setup

The plugin requires a minimum SDK of 26 (Android 8.0). Make sure your `android/variables.gradle` has:

```gradle
minSdkVersion = 26
```

## Usage

### Initialize the Client

```typescript
import { CapacitorSupabase } from '@capgo/capacitor-supabase';

await CapacitorSupabase.initialize({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});
```

### Authentication

#### Sign In with Email/Password

```typescript
const { session, user } = await CapacitorSupabase.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Access the JWT token
console.log('JWT:', session?.accessToken);
```

#### Sign Up

```typescript
const { session, user } = await CapacitorSupabase.signUp({
  email: 'newuser@example.com',
  password: 'password123',
  data: { name: 'John Doe' }
});
```

#### OAuth Sign In

```typescript
await CapacitorSupabase.signInWithOAuth({
  provider: 'google',
  redirectTo: 'myapp://callback'
});
```

#### OTP Sign In

```typescript
// Send OTP
await CapacitorSupabase.signInWithOtp({
  email: 'user@example.com'
});

// Verify OTP
const { session, user } = await CapacitorSupabase.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email'
});
```

#### Sign Out

```typescript
await CapacitorSupabase.signOut();
```

### Session Management

#### Get Current Session

```typescript
const { session } = await CapacitorSupabase.getSession();
if (session) {
  console.log('JWT:', session.accessToken);
  console.log('Refresh Token:', session.refreshToken);
  console.log('Expires At:', session.expiresAt);
}
```

#### Refresh Session

```typescript
const { session } = await CapacitorSupabase.refreshSession();
```

#### Get Current User

```typescript
const { user } = await CapacitorSupabase.getUser();
if (user) {
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
}
```

#### Set Session Manually

```typescript
const { session } = await CapacitorSupabase.setSession({
  accessToken: 'eyJ...',
  refreshToken: 'abc123'
});
```

### Listen to Auth State Changes

```typescript
const listener = await CapacitorSupabase.addListener(
  'authStateChange',
  ({ event, session }) => {
    console.log('Auth event:', event);
    // Events: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
    if (session) {
      console.log('JWT:', session.accessToken);
    }
  }
);

// Later, remove the listener
listener.remove();
```

### Using JWT with @supabase/supabase-js

The main use case is to get the JWT from native auth and use it with the JavaScript Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';
import { CapacitorSupabase } from '@capgo/capacitor-supabase';

// Initialize native client
await CapacitorSupabase.initialize({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});

// Sign in natively
await CapacitorSupabase.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get session with JWT
const { session } = await CapacitorSupabase.getSession();

// Create JS client with the native session
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key',
  {
    global: {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`
      }
    }
  }
);

// Now use supabase-js as normal
const { data } = await supabase.from('table').select('*');
```

### Database Operations (Native)

The plugin also supports native database operations:

#### Select

```typescript
const { data, error } = await CapacitorSupabase.select({
  table: 'users',
  columns: 'id, name, email',
  filter: { active: true },
  limit: 10,
  orderBy: 'created_at',
  ascending: false
});
```

#### Insert

```typescript
const { data, error } = await CapacitorSupabase.insert({
  table: 'posts',
  values: { title: 'Hello', content: 'World' }
});
```

#### Update

```typescript
const { data, error } = await CapacitorSupabase.update({
  table: 'posts',
  values: { title: 'Updated Title' },
  filter: { id: 1 }
});
```

#### Delete

```typescript
const { data, error } = await CapacitorSupabase.delete({
  table: 'posts',
  filter: { id: 1 }
});
```

## API

<docgen-index>

* [`initialize(...)`](#initialize)
* [`signInWithPassword(...)`](#signinwithpassword)
* [`signUp(...)`](#signup)
* [`signInWithOAuth(...)`](#signinwithoauth)
* [`signInWithOtp(...)`](#signinwithotp)
* [`verifyOtp(...)`](#verifyotp)
* [`signOut()`](#signout)
* [`getSession()`](#getsession)
* [`refreshSession()`](#refreshsession)
* [`getUser()`](#getuser)
* [`setSession(...)`](#setsession)
* [`addListener('authStateChange', ...)`](#addlistenerauthstatechange-)
* [`removeAllListeners()`](#removealllisteners)
* [`select(...)`](#select)
* [`insert(...)`](#insert)
* [`update(...)`](#update)
* [`delete(...)`](#delete)
* [`getPluginVersion()`](#getpluginversion)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

Capacitor Supabase Plugin for native Supabase SDK integration.

This plugin provides native iOS and Android Supabase SDK functionality
with the ability to retrieve JWT tokens for use in JavaScript/web layers.

### initialize(...)

```typescript
initialize(options: SupabaseConfig) => Promise<void>
```

Initialize the Supabase client with your project credentials.
Must be called before any other methods.

| Param         | Type                                                      | Description                                       |
| ------------- | --------------------------------------------------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#supabaseconfig">SupabaseConfig</a></code> | - Configuration options including URL and API key |

**Since:** 0.0.1

--------------------


### signInWithPassword(...)

```typescript
signInWithPassword(options: SignInWithPasswordOptions) => Promise<AuthResult>
```

Sign in with email and password.

| Param         | Type                                                                            | Description                      |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| **`options`** | <code><a href="#signinwithpasswordoptions">SignInWithPasswordOptions</a></code> | - Email and password credentials |

**Returns:** <code>Promise&lt;<a href="#authresult">AuthResult</a>&gt;</code>

**Since:** 0.0.1

--------------------


### signUp(...)

```typescript
signUp(options: SignUpOptions) => Promise<AuthResult>
```

Sign up a new user with email and password.

| Param         | Type                                                    | Description                                   |
| ------------- | ------------------------------------------------------- | --------------------------------------------- |
| **`options`** | <code><a href="#signupoptions">SignUpOptions</a></code> | - Email, password, and optional user metadata |

**Returns:** <code>Promise&lt;<a href="#authresult">AuthResult</a>&gt;</code>

**Since:** 0.0.1

--------------------


### signInWithOAuth(...)

```typescript
signInWithOAuth(options: SignInWithOAuthOptions) => Promise<void>
```

Sign in with an OAuth provider.
Opens the provider's authentication page.

| Param         | Type                                                                      | Description                                |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#signinwithoauthoptions">SignInWithOAuthOptions</a></code> | - OAuth provider and optional redirect URL |

**Since:** 0.0.1

--------------------


### signInWithOtp(...)

```typescript
signInWithOtp(options: SignInWithOtpOptions) => Promise<void>
```

Sign in with OTP (One-Time Password) sent via email or SMS.

| Param         | Type                                                                  | Description                            |
| ------------- | --------------------------------------------------------------------- | -------------------------------------- |
| **`options`** | <code><a href="#signinwithotpoptions">SignInWithOtpOptions</a></code> | - Email or phone number to send OTP to |

**Since:** 0.0.1

--------------------


### verifyOtp(...)

```typescript
verifyOtp(options: VerifyOtpOptions) => Promise<AuthResult>
```

Verify an OTP token.

| Param         | Type                                                          | Description                                 |
| ------------- | ------------------------------------------------------------- | ------------------------------------------- |
| **`options`** | <code><a href="#verifyotpoptions">VerifyOtpOptions</a></code> | - Email/phone, token, and verification type |

**Returns:** <code>Promise&lt;<a href="#authresult">AuthResult</a>&gt;</code>

**Since:** 0.0.1

--------------------


### signOut()

```typescript
signOut() => Promise<void>
```

Sign out the current user.

**Since:** 0.0.1

--------------------


### getSession()

```typescript
getSession() => Promise<{ session: Session | null; }>
```

Get the current session if one exists.
Returns the session with JWT access token.

**Returns:** <code>Promise&lt;{ session: <a href="#session">Session</a> | null; }&gt;</code>

**Since:** 0.0.1

--------------------


### refreshSession()

```typescript
refreshSession() => Promise<{ session: Session | null; }>
```

Refresh the current session and get new tokens.

**Returns:** <code>Promise&lt;{ session: <a href="#session">Session</a> | null; }&gt;</code>

**Since:** 0.0.1

--------------------


### getUser()

```typescript
getUser() => Promise<{ user: User | null; }>
```

Get the currently authenticated user.

**Returns:** <code>Promise&lt;{ user: <a href="#user">User</a> | null; }&gt;</code>

**Since:** 0.0.1

--------------------


### setSession(...)

```typescript
setSession(options: SetSessionOptions) => Promise<{ session: Session | null; }>
```

Set the session manually with access and refresh tokens.
Useful for restoring a session or integrating with external auth.

| Param         | Type                                                            | Description                 |
| ------------- | --------------------------------------------------------------- | --------------------------- |
| **`options`** | <code><a href="#setsessionoptions">SetSessionOptions</a></code> | - Access and refresh tokens |

**Returns:** <code>Promise&lt;{ session: <a href="#session">Session</a> | null; }&gt;</code>

**Since:** 0.0.1

--------------------


### addListener('authStateChange', ...)

```typescript
addListener(eventName: 'authStateChange', listenerFunc: (data: AuthStateChange) => void) => Promise<PluginListenerHandle>
```

Listen to authentication state changes.

| Param              | Type                                                                           | Description                                |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| **`eventName`**    | <code>'authStateChange'</code>                                                 | - Must be 'authStateChange'                |
| **`listenerFunc`** | <code>(data: <a href="#authstatechange">AuthStateChange</a>) =&gt; void</code> | - Callback function for auth state changes |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.0.1

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all listeners for auth state changes.

**Since:** 0.0.1

--------------------


### select(...)

```typescript
select<T = unknown>(options: SelectOptions) => Promise<QueryResult<T[]>>
```

Execute a SELECT query on a table.

| Param         | Type                                                    | Description                                       |
| ------------- | ------------------------------------------------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#selectoptions">SelectOptions</a></code> | - Query options including table, columns, filters |

**Returns:** <code>Promise&lt;<a href="#queryresult">QueryResult</a>&lt;T[]&gt;&gt;</code>

**Since:** 0.0.1

--------------------


### insert(...)

```typescript
insert<T = unknown>(options: InsertOptions) => Promise<QueryResult<T>>
```

Insert data into a table.

| Param         | Type                                                    | Description                       |
| ------------- | ------------------------------------------------------- | --------------------------------- |
| **`options`** | <code><a href="#insertoptions">InsertOptions</a></code> | - Table name and values to insert |

**Returns:** <code>Promise&lt;<a href="#queryresult">QueryResult</a>&lt;T&gt;&gt;</code>

**Since:** 0.0.1

--------------------


### update(...)

```typescript
update<T = unknown>(options: UpdateOptions) => Promise<QueryResult<T>>
```

Update data in a table.

| Param         | Type                                                    | Description                                           |
| ------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#updateoptions">UpdateOptions</a></code> | - Table name, values to update, and filter conditions |

**Returns:** <code>Promise&lt;<a href="#queryresult">QueryResult</a>&lt;T&gt;&gt;</code>

**Since:** 0.0.1

--------------------


### delete(...)

```typescript
delete<T = unknown>(options: DeleteOptions) => Promise<QueryResult<T>>
```

Delete data from a table.

| Param         | Type                                                    | Description                        |
| ------------- | ------------------------------------------------------- | ---------------------------------- |
| **`options`** | <code><a href="#deleteoptions">DeleteOptions</a></code> | - Table name and filter conditions |

**Returns:** <code>Promise&lt;<a href="#queryresult">QueryResult</a>&lt;T&gt;&gt;</code>

**Since:** 0.0.1

--------------------


### getPluginVersion()

```typescript
getPluginVersion() => Promise<{ version: string; }>
```

Get the native Capacitor plugin version.

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

**Since:** 0.0.1

--------------------


### Interfaces


#### SupabaseConfig

Configuration options for initializing the Supabase client.

| Prop              | Type                | Description                        | Since |
| ----------------- | ------------------- | ---------------------------------- | ----- |
| **`supabaseUrl`** | <code>string</code> | The Supabase project URL.          | 0.0.1 |
| **`supabaseKey`** | <code>string</code> | The Supabase anonymous/public key. | 0.0.1 |


#### AuthResult

Result of authentication operations that return a session.

| Prop          | Type                                                | Description                                   | Since |
| ------------- | --------------------------------------------------- | --------------------------------------------- | ----- |
| **`session`** | <code><a href="#session">Session</a> \| null</code> | The session if authentication was successful. | 0.0.1 |
| **`user`**    | <code><a href="#user">User</a> \| null</code>       | The authenticated user if successful.         | 0.0.1 |


#### Session

<a href="#session">Session</a> object containing authentication tokens.

| Prop               | Type                                  | Description                                                    | Since |
| ------------------ | ------------------------------------- | -------------------------------------------------------------- | ----- |
| **`accessToken`**  | <code>string</code>                   | The JWT access token. Use this for authenticated API requests. | 0.0.1 |
| **`refreshToken`** | <code>string</code>                   | The refresh token for obtaining new access tokens.             | 0.0.1 |
| **`tokenType`**    | <code>string</code>                   | Token type (usually "bearer").                                 | 0.0.1 |
| **`expiresIn`**    | <code>number</code>                   | Number of seconds until the access token expires.              | 0.0.1 |
| **`expiresAt`**    | <code>number</code>                   | Unix timestamp when the token expires.                         | 0.0.1 |
| **`user`**         | <code><a href="#user">User</a></code> | The authenticated user.                                        | 0.0.1 |


#### User

<a href="#user">User</a> object returned from authentication operations.

| Prop               | Type                                                             | Description                                        | Since |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------- | ----- |
| **`id`**           | <code>string</code>                                              | Unique identifier for the user.                    | 0.0.1 |
| **`email`**        | <code>string</code>                                              | <a href="#user">User</a>'s email address.          | 0.0.1 |
| **`phone`**        | <code>string</code>                                              | <a href="#user">User</a>'s phone number.           | 0.0.1 |
| **`createdAt`**    | <code>string</code>                                              | Timestamp when the user was created.               | 0.0.1 |
| **`lastSignInAt`** | <code>string</code>                                              | Timestamp when the user last signed in.            | 0.0.1 |
| **`userMetadata`** | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | <a href="#user">User</a> metadata (custom fields). | 0.0.1 |
| **`appMetadata`**  | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | App metadata.                                      | 0.0.1 |


#### SignInWithPasswordOptions

Options for email/password sign-in.

| Prop           | Type                | Description                               | Since |
| -------------- | ------------------- | ----------------------------------------- | ----- |
| **`email`**    | <code>string</code> | <a href="#user">User</a>'s email address. | 0.0.1 |
| **`password`** | <code>string</code> | <a href="#user">User</a>'s password.      | 0.0.1 |


#### SignUpOptions

Options for email/password sign-up.

| Prop           | Type                                                             | Description                                    | Since |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ----- |
| **`email`**    | <code>string</code>                                              | <a href="#user">User</a>'s email address.      | 0.0.1 |
| **`password`** | <code>string</code>                                              | <a href="#user">User</a>'s password.           | 0.0.1 |
| **`data`**     | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Optional user metadata to store with the user. | 0.0.1 |


#### SignInWithOAuthOptions

Options for OAuth sign-in.

| Prop             | Type                                                    | Description                              | Since |
| ---------------- | ------------------------------------------------------- | ---------------------------------------- | ----- |
| **`provider`**   | <code><a href="#oauthprovider">OAuthProvider</a></code> | The OAuth provider to use.               | 0.0.1 |
| **`redirectTo`** | <code>string</code>                                     | URL to redirect to after authentication. | 0.0.1 |
| **`scopes`**     | <code>string</code>                                     | OAuth scopes to request.                 | 0.0.1 |


#### SignInWithOtpOptions

Options for OTP sign-in.

| Prop        | Type                | Description                                                                   | Since |
| ----------- | ------------------- | ----------------------------------------------------------------------------- | ----- |
| **`email`** | <code>string</code> | <a href="#user">User</a>'s email address (required if phone is not provided). | 0.0.1 |
| **`phone`** | <code>string</code> | <a href="#user">User</a>'s phone number (required if email is not provided).  | 0.0.1 |


#### VerifyOtpOptions

Options for verifying OTP.

| Prop        | Type                                                                   | Description                                                                   | Since |
| ----------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| **`email`** | <code>string</code>                                                    | <a href="#user">User</a>'s email address (required if phone is not provided). | 0.0.1 |
| **`phone`** | <code>string</code>                                                    | <a href="#user">User</a>'s phone number (required if email is not provided).  | 0.0.1 |
| **`token`** | <code>string</code>                                                    | The OTP token received via email/SMS.                                         | 0.0.1 |
| **`type`**  | <code>'sms' \| 'email' \| 'magiclink' \| 'signup' \| 'recovery'</code> | The type of OTP verification.                                                 | 0.0.1 |


#### SetSessionOptions

Options for setting a session manually.

| Prop               | Type                | Description        | Since |
| ------------------ | ------------------- | ------------------ | ----- |
| **`accessToken`**  | <code>string</code> | The access token.  | 0.0.1 |
| **`refreshToken`** | <code>string</code> | The refresh token. | 0.0.1 |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### AuthStateChange

Auth state change callback data.

| Prop          | Type                                                        | Description                               | Since |
| ------------- | ----------------------------------------------------------- | ----------------------------------------- | ----- |
| **`event`**   | <code><a href="#authchangeevent">AuthChangeEvent</a></code> | The type of auth event.                   | 0.0.1 |
| **`session`** | <code><a href="#session">Session</a> \| null</code>         | The current session (null if signed out). | 0.0.1 |


#### QueryResult

Result of database queries.

| Prop        | Type                        | Description                                         | Since |
| ----------- | --------------------------- | --------------------------------------------------- | ----- |
| **`data`**  | <code>T \| null</code>      | The query result data.                              | 0.0.1 |
| **`error`** | <code>string \| null</code> | Error message if the query failed.                  | 0.0.1 |
| **`count`** | <code>number</code>         | Number of affected rows (for insert/update/delete). | 0.0.1 |


#### SelectOptions

Options for database select queries.

| Prop            | Type                                                             | Description                              | Since |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------- | ----- |
| **`table`**     | <code>string</code>                                              | The table name to query.                 | 0.0.1 |
| **`columns`**   | <code>string</code>                                              | Columns to select (default: "*").        | 0.0.1 |
| **`filter`**    | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Filter conditions as key-value pairs.    | 0.0.1 |
| **`limit`**     | <code>number</code>                                              | Maximum number of rows to return.        | 0.0.1 |
| **`offset`**    | <code>number</code>                                              | Number of rows to skip.                  | 0.0.1 |
| **`orderBy`**   | <code>string</code>                                              | Column to order by.                      | 0.0.1 |
| **`ascending`** | <code>boolean</code>                                             | Order direction.                         | 0.0.1 |
| **`single`**    | <code>boolean</code>                                             | Return a single row instead of an array. | 0.0.1 |


#### InsertOptions

Options for database insert queries.

| Prop         | Type                                                                                                                      | Description                                             | Since |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----- |
| **`table`**  | <code>string</code>                                                                                                       | The table name to insert into.                          | 0.0.1 |
| **`values`** | <code><a href="#record">Record</a>&lt;string, unknown&gt; \| <a href="#record">Record</a>&lt;string, unknown&gt;[]</code> | The data to insert (single object or array of objects). | 0.0.1 |


#### UpdateOptions

Options for database update queries.

| Prop         | Type                                                             | Description                                | Since |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------ | ----- |
| **`table`**  | <code>string</code>                                              | The table name to update.                  | 0.0.1 |
| **`values`** | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | The data to update.                        | 0.0.1 |
| **`filter`** | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Filter conditions to match rows to update. | 0.0.1 |


#### DeleteOptions

Options for database delete queries.

| Prop         | Type                                                             | Description                                | Since |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------ | ----- |
| **`table`**  | <code>string</code>                                              | The table name to delete from.             | 0.0.1 |
| **`filter`** | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Filter conditions to match rows to delete. | 0.0.1 |


### Type Aliases


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


#### OAuthProvider

Supported OAuth providers.

<code>'apple' | 'azure' | 'bitbucket' | 'discord' | 'facebook' | 'figma' | 'github' | 'gitlab' | 'google' | 'kakao' | 'keycloak' | 'linkedin' | 'linkedin_oidc' | 'notion' | 'slack' | 'slack_oidc' | 'spotify' | 'twitch' | 'twitter' | 'workos' | 'zoom'</code>


#### AuthChangeEvent

Auth state change event types.

<code>'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY'</code>

</docgen-api>

## License

MPL-2.0
