# Skill: API & Backend Endpoints

Use this skill when building REST API routes, Next.js route handlers, or Supabase Edge Functions.

---

## Request Lifecycle

Every endpoint must handle this sequence:

```
1. Parse input        → validate shape and types
2. Authenticate       → verify who is making the request
3. Authorize          → verify they have permission to do this
4. Business logic     → do the actual work
5. Return response    → success OR structured error
```

Never skip steps 2 or 3. Never return different response shapes for success vs error.

---

## Input Validation

Use a validation library. Recommended: **Zod**

```typescript
import { z } from 'zod';

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(100),
  duration_minutes: z.number().int().min(1).max(180),
  notes: z.string().max(500).optional(),
});

// In the handler
const result = CreateSessionSchema.safeParse(body);
if (!result.success) {
  return Response.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 });
}
const { title, duration_minutes, notes } = result.data;
```

Never use raw `body.someField` without validation. Never trust the client.

---

## Response Format

Consistent response shape across all endpoints:

```typescript
// Success
{ data: T }

// Error
{ error: string, code?: string }

// Paginated list
{ data: T[], count: number, page: number, pageSize: number }
```

Always use the same HTTP status codes:
| Status | When |
|--------|------|
| 200 | Successful GET, UPDATE |
| 201 | Successful CREATE |
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, constraint violation) |
| 500 | Unexpected server error |

---

## Next.js Route Handlers

```typescript
// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const supabase = createServerClient(/* cookies */);
  
  // Authenticate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Validate
  const body = await req.json();
  const result = CreateSessionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  
  // Execute
  const { data, error } = await supabase.from('sessions').insert({ ...result.data, user_id: user.id }).select().single();
  if (error) {
    console.error('[POST /api/sessions]', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
  
  return NextResponse.json({ data }, { status: 201 });
}
```

---

## Error Handling Rules

- **Log internally with context** — function name, user id (not PII), input shape
- **Return generic messages to clients** — never raw database errors, stack traces, or internal IDs
- **Never leak which resource doesn't exist** to unauthenticated users (return 404 not 403 for owned resources)

```typescript
// ❌ Bad — leaks internals
return Response.json({ error: error.message }); // e.g. "duplicate key value violates unique constraint"

// ✅ Good
console.error('[createSession] DB error:', error.code, error.message);
return Response.json({ error: 'Failed to create session' }, { status: 500 });
```

---

## Rate Limiting & Abuse Prevention

For public-facing or sensitive endpoints:
- Implement rate limiting by IP or user ID (use Upstash Redis + `@upstash/ratelimit` for serverless)
- Limit sensitive endpoints (password reset, OTP) to a low rate (e.g., 5 requests per 15 minutes)
- Idempotency keys for financial or irreversible operations

---

## Checklist Before Shipping an Endpoint

- [ ] Input validated with schema (Zod)
- [ ] Authentication verified (JWT checked server-side)
- [ ] Authorization verified (user can only access their own data)
- [ ] Errors logged with context, generic message returned to client
- [ ] Response shape is consistent with other endpoints
- [ ] Edge cases tested: missing fields, unauthorized access, resource not found
