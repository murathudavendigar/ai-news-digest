# Skill: Debugging

Use this skill when the task is to investigate and fix a bug, error, or unexpected behavior.

---

## Debugging Protocol

### Step 1 — Understand the Symptom

Before touching any code, establish:
- **What is the actual behavior?** (exact error message, screenshot, reproduction steps)
- **What is the expected behavior?**
- **When did it start?** (after a specific commit, update, or change?)
- **Is it reproducible?** (always, sometimes, only in certain conditions?)

Do not start debugging until you can answer all four.

---

### Step 2 — Locate the Failure

Work from the outside in:
1. Start at the entry point (user action, API call, event)
2. Follow the data flow until you find where the actual value diverges from the expected value
3. Use the error stack trace — read it from top to bottom, find the first line that's in *this* codebase (not a library)

---

### Step 3 — Identify Root Cause

**Do not fix the symptom — fix the cause.**

Common traps:
- Fixing the error message instead of the condition that causes it
- Adding a null check without understanding why the value is null
- Wrapping in try/catch instead of fixing why it throws

Ask: "Why does this happen?" at least twice before concluding you've found the root cause.

---

### Step 4 — Fix

- Make the smallest possible change that fixes the root cause
- Do not refactor surrounding code during a bug fix
- If the fix requires a larger refactor, note it separately

---

### Step 5 — Verify

After fixing:
1. Does the original error still reproduce? (it shouldn't)
2. Does the feature work end-to-end?
3. Are there related cases that could have the same bug?

---

## Common Bug Patterns

### React Native / Expo
- `undefined is not an object` → something is accessed before it's loaded; check async initialization order
- Blank screen / freeze → check for infinite re-render loops (`useEffect` with missing or wrong deps)
- Layout shift → check for missing `SafeAreaView` or dynamic height without `minHeight`
- State not updating → check if state is being mutated directly instead of replaced

### Supabase
- `401 Unauthorized` → session is missing or expired; check if `getSession()` is called before the request
- `403 Forbidden` → RLS policy is blocking the request; check policy conditions match the actual auth context
- Edge Function `500` → check Supabase dashboard logs for the actual error; the client error is generic
- Types mismatch → regenerate types after schema changes

### Next.js
- Hydration mismatch → server and client render different HTML; common cause: `Date.now()`, `Math.random()`, or browser-only APIs in a Server Component
- `Cannot read properties of undefined` in Server Component → async data fetch failed silently; always check for null
- Stale data → check `revalidate` settings or missing cache invalidation after mutation

### TypeScript
- `Type 'X' is not assignable to type 'Y'` → don't cast with `as` to silence it — fix the actual type mismatch
- `Object is possibly undefined` → handle the undefined case explicitly, don't use `!` non-null assertion unless you are 100% certain

---

## What Not to Do

- Don't add `// @ts-ignore` or `// eslint-disable` without a comment explaining why
- Don't add random null checks everywhere hoping one of them fixes it
- Don't delete error handling to make the error disappear
- Don't push a fix without understanding why it works
