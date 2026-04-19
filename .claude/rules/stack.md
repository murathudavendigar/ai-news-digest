# Stack Rules

Conventions for the stacks used across projects. Update the relevant section per project.

---

## React / Next.js

- Use **App Router** conventions (Next.js 13+) — no Pages Router patterns
- Server Components by default — add `"use client"` only when needed (event handlers, hooks, browser APIs)
- Co-locate components with their routes when they are route-specific; put shared components in `/components`
- Folder naming: `kebab-case` for routes, `PascalCase` for component files
- Use `next/image` for all images — never raw `<img>` tags
- Environment variables: public vars prefixed with `NEXT_PUBLIC_`, server vars never exposed to client
- API routes go in `/app/api/` — each route in its own folder with `route.ts`

---


## Supabase

- **RLS is always on** — every table must have RLS policies before shipping
- Use the typed client (`supabase-js` with generated types) — no untyped `.from('table')`
- Generate types after every schema change: `supabase gen types typescript --local`
- Edge Functions are written in TypeScript — no JavaScript
- Service role key is **never** used on the client side — server/edge only
- Auth helpers: use `@supabase/ssr` for Next.js, `@supabase/supabase-js` for Expo
- Always handle the case where `session` is `null` — don't assume the user is logged in

---

## TypeScript

- **Strict mode is on** — `"strict": true` in tsconfig, no exceptions
- No `any` — use `unknown` and narrow it, or define a proper type
- Prefer `interface` for object shapes, `type` for unions and intersections
- Export types from a central `/types` folder for shared models
- API response types must be explicitly defined — don't infer from `fetch()` response

---

## Styling (Tailwind / NativeWind)

- **No inline styles** except for truly dynamic values (e.g., `width: progress + '%'`)
- Class ordering: layout → spacing → sizing → typography → colors → effects
- Use design tokens (CSS variables or theme config) — no magic hex values in class names
- Dark mode: implement from day one with `dark:` variants — don't retrofit it

---

## Testing

- Unit tests go next to the file they test: `Button.tsx` → `Button.test.tsx`
- Integration tests go in `/__tests__/`
- Test behavior, not implementation — don't test internal state directly
- Mock external services (Supabase, RevenueCat) in tests — never hit real APIs

---

## Environment Variables

```
# Always document every variable in .env.example
# Never commit .env or .env.local
# Validate required env vars at startup — fail fast if missing
```
