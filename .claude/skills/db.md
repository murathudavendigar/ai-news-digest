# Skill: Database & Supabase

Use this skill when writing migrations, queries, RLS policies, or Edge Functions that interact with the database.

---

## Schema Changes

### Migration Rules
- Every schema change goes in a new migration file — never edit existing migrations
- Migration file naming: `YYYYMMDDHHMMSS_description.sql` (Supabase CLI handles this)
- Every `CREATE TABLE` must include: `id`, `created_at`, `updated_at` (use triggers for `updated_at`)
- Run `supabase gen types typescript --local` after every schema change

### Column Conventions
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
created_at  timestamptz default now() not null
updated_at  timestamptz default now() not null
```

### Foreign Keys
- Always define `ON DELETE` behavior explicitly — never leave it implicit
- User-owned data: `ON DELETE CASCADE` (delete user → delete their data)
- Referenced metadata: `ON DELETE RESTRICT` or `ON DELETE SET NULL` depending on business logic

---

## RLS Policies

**RLS is mandatory.** No table ships without it.

### Policy Template
```sql
-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Users can only read their own rows
CREATE POLICY "Users can view own rows"
  ON public.your_table FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "Users can insert own rows"
  ON public.your_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "Users can update own rows"
  ON public.your_table FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "Users can delete own rows"
  ON public.your_table FOR DELETE
  USING (auth.uid() = user_id);
```

### Policy Checklist
- [ ] SELECT policy: Does this user have the right to read this row?
- [ ] INSERT policy: Is the `user_id` being set to `auth.uid()`? (prevent spoofing)
- [ ] UPDATE policy: Can the user update all columns, or should some be immutable?
- [ ] DELETE policy: Should users be able to delete this, or only admins?

### Common Mistakes
- Using `WITH CHECK` without `USING` on UPDATE — both are needed
- Forgetting to enable RLS after creating the table
- Writing a policy for `INSERT` that doesn't verify `auth.uid() = user_id` in `WITH CHECK`

---

## Queries (TypeScript)

### Use Generated Types
```typescript
import { Database } from '@/types/supabase';
type UserProgress = Database['public']['Tables']['user_progress']['Row'];
```

### Pattern: Fetch with Error Handling
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*, session_tasks(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) {
  // Don't expose raw Supabase errors to the user
  console.error('[fetchSessions]', error);
  throw new Error('Failed to load sessions');
}

return data;
```

### Pattern: Upsert
```typescript
const { error } = await supabase
  .from('user_progress')
  .upsert({ user_id: userId, ...progressData }, { onConflict: 'user_id,session_id' });
```

### Never Do This
```typescript
// ❌ No error handling
const { data } = await supabase.from('users').select('*');

// ❌ No type safety
const result = await supabase.from('users' as any).select('*');

// ❌ Service role key on client
const supabase = createClient(url, SERVICE_ROLE_KEY); // only in server/edge
```

---

## Edge Functions

### Structure
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // 1. Parse and validate input
  const body = await req.json();
  
  // 2. Authenticate
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });
  
  // 3. Business logic
  try {
    // ... do work ...
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[function-name]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
```

### Edge Function Rules
- Always validate the JWT — don't trust the `user_id` from the request body
- Use the user's JWT (not service role) unless you specifically need elevated permissions
- Log errors server-side with context, return generic messages to the client
- Always set `Content-Type` header on JSON responses

---

## Atomic Operations

For operations that must succeed or fail together (e.g., creating a user + their profile):

```typescript
// Use Supabase RPC for atomic DB operations
const { error } = await supabase.rpc('create_user_with_profile', {
  user_id: userId,
  display_name: name,
});
```

Create the function in a migration:
```sql
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_id uuid,
  display_name text
) RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, display_name) VALUES (user_id, display_name);
  INSERT INTO user_settings (user_id) VALUES (user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
