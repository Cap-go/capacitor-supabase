# Example App for `@capgo/capacitor-supabase`

This Vite project links directly to the local plugin source so you can exercise the native APIs while developing.

## Actions in this playground

- **Initialize** – Initialize the Supabase client with your project credentials.
- **Sign in with password** – Sign in with email and password.
- **Sign up** – Sign up a new user with email and password.
- **Sign in with OAuth** – Sign in with an OAuth provider (opens external browser).
- **Sign in with OTP** – Send a one-time password to email or phone.
- **Verify OTP** – Verify the one-time password received.
- **Get session** – Get the current session with JWT access token.
- **Get user** – Get the current authenticated user.
- **Refresh session** – Refresh the current session tokens.
- **Sign out** – Sign out the current user.
- **Select (Database)** – Execute a SELECT query on a table.
- **Insert (Database)** – Insert data into a table.

## Getting started

```bash
npm install
npm start
```

Add native shells with `npx cap add ios` or `npx cap add android` from this folder to try behaviour on device or simulator.
