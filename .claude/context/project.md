# Project Context

Fill this file out when starting a new project or onboarding the agent to an existing one.
The agent reads this to understand the domain before touching any code.

---

## Project Overview

```
Name:
Description:
Status: [in-development | beta | production]
Started:
```

---

## Tech Stack

```
Frontend:
Backend:
Database:
Auth:
Hosting:
Payments:
Push Notifications:
Analytics:
```

---

## Repository Structure

```
Describe the top-level folder structure and what each folder contains.
Example:

/app          → Expo Router screens
/components   → Shared UI components
/store        → Zustand stores
/lib          → Utility functions and Supabase client
/supabase     → Migrations, Edge Functions, seed data
/types        → Shared TypeScript types
```

---

## Key Domain Concepts

```
List the 5-10 core entities/concepts in this domain that the agent needs to understand.
Example for a coaching app:

- Session: A structured coaching interaction with tasks and a timer
- Program: An ordered collection of sessions
- Subscription: A RevenueCat entitlement that gates access to full programs
- Achievement: A badge earned by completing milestones
```

---

## Data Model (High Level)

```
List the main database tables and their relationships.
Example:

users (auth.users)
  └─ profiles (1:1)
  └─ user_progress (1:many)
  └─ subscriptions (1:many)

programs
  └─ sessions (1:many)
     └─ session_tasks (1:many)
```

---

## Environment Variables

```
List all required environment variables (values stay in .env.local — just names here)

EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
REVENUECAT_API_KEY_IOS
REVENUECAT_API_KEY_ANDROID
```

---

## Known Constraints & Decisions

```
List architectural decisions that were made and must not be changed without discussion.
Example:

- We use Zustand for global state — do not introduce Context or Redux
- The `app_settings` table is cached in middleware — changes require cache invalidation
- Service role key is only used in Edge Functions — never expose to client
- All user-facing error messages are sanitized — never show raw Supabase errors
```

---

## Current Focus

```
What is the team/person currently working on?
What should the agent prioritize?
What areas of the codebase are actively being changed?
```

---

## Out of Scope

```
What should the agent NOT touch or change without explicit permission?
Example:

- Subscription paywall logic — do not change entitlement checks
- RLS policies — all changes require explicit review
- Account deletion flow — atomic, do not simplify
```
