# CLAUDE.md

This file defines how AI coding agents (Claude, Cursor, Cline, etc.) should behave in this project. Read all referenced files before writing any code.

---

## Project Context

> Fill in the relevant section for this project before using.

```
PROJECT_NAME: AI News Digest
TYPE: web-app
STACK: Next.js, TypeScript, Tailwind CSS, Supabase
PRIMARY_LANGUAGE: TypeScript
PACKAGE_MANAGER: bun
```

---

## Required Reading

Before touching any code, read these files in order:

1. `.claude/rules/core.md` — Non-negotiable coding standards
2. `.claude/rules/stack.md` — Stack-specific conventions
3. `.claude/rules/git.md` — Commit and branch rules
4. `.claude/agents/default.md` — How to behave as an agent

For specific tasks, also read:
- `.claude/skills/debugging.md` — When fixing bugs
- `.claude/skills/refactoring.md` — When restructuring code
- `.claude/skills/ui.md` — When building UI components
- `.claude/skills/api.md` — When building backend endpoints or edge functions
- `.claude/skills/auth.md` — When touching anything auth-related
- `.claude/skills/db.md` — When writing queries or migrations

---

## Quick Rules (TL;DR)

- **Never rewrite working code** unless explicitly asked
- **Never delete files** without asking first
- **Always ask** before installing new dependencies
- **One task at a time** — finish it completely before moving on
- **No placeholder comments** like `// TODO: implement` — write real code
- **No hallucinated APIs** — if you're not sure a method exists, say so
- **Keep diffs minimal** — change only what is necessary

---

## How to Ask for Clarification

If requirements are ambiguous, stop and ask. Do not guess and implement. List your assumptions explicitly and wait for confirmation before proceeding.
