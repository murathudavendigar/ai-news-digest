# Skill: Authentication

Use this skill when touching anything related to authentication, sessions, or user identity.

---

## Golden Rules

1. **Never trust the client** for the user's identity — always verify server-side
2. **Never expose the service role key** outside of server/edge contexts
3. **Session expiry is real** — always handle the case where a session has expired
4. **Deep links with tokens** are security-sensitive — handle them carefully

---

## Session Handling

### Mobile (Expo / React Native)
```typescript
// Initialize Supabase with secure storage
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Web (Next.js)
```typescript
// Use @supabase/ssr — never use createClient from supabase-js directly in Next.js
import { createServerClient } from '@supabase/ssr';
```

---

## Auth State Listener

Set up the auth state listener once at the app root level. Don't call `getSession()` in every component.

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      // Clear local state, navigate to auth screen
    }
    if (event === 'TOKEN_REFRESHED') {
      // Session was refreshed silently — update store if needed
    }
  });
  
  return () => subscription.unsubscribe();
}, []);
```

---

## Account Deletion

Account deletion must be atomic. The sequence:

1. Call a Supabase Edge Function with the user's JWT
2. Edge Function verifies the JWT to confirm identity
3. Edge Function uses service role to: delete user data → delete auth user
4. Client receives success → clears local state → navigates to auth screen

**Never delete the auth user from the client directly.** Always go through an Edge Function.

```typescript
// Edge Function pattern for account deletion
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return new Response('Unauthorized', { status: 401 });

// Use admin client for deletion
const adminSupabase = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
```

---

## Social Auth (Apple, Google)

### Apple Sign In (iOS)
- Required for iOS apps that offer any third-party login
- Always request `fullName` and `email` scopes — but Apple only provides them on first sign-in
- Store the user's name on first sign-in — you won't get it again
- Handle the case where Apple returns `null` for email (rare but possible)

### Google OAuth
- On web: use `@supabase/ssr` redirect flow
- On mobile: use `expo-auth-session` or `react-native-google-signin` — never open a WebView manually

---

## Protected Routes

### Mobile (Expo Router)
```typescript
// app/_layout.tsx
const { session, loading } = useAuthStore();

if (loading) return <SplashScreen />;
if (!session) return <Redirect href="/auth/login" />;
```

### Web (Next.js Middleware)
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && isProtectedRoute(req.pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
```

---

## Auth Checklist

- [ ] Sessions stored securely (SecureStore on mobile, httpOnly cookies on web)
- [ ] Token refresh handled automatically
- [ ] Unauthenticated access to protected routes is blocked
- [ ] Account deletion is atomic and server-verified
- [ ] Auth errors shown to users are human-readable (not Supabase error codes)
- [ ] Sign-out clears all local state (store, cache, navigation history)
