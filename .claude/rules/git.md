# Git Rules

---

## Commit Messages

Follow **Conventional Commits**: `type(scope): short description`

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `style` | Formatting, whitespace, no logic change |
| `chore` | Build, config, dependency updates |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |

**Examples:**
```
feat(auth): add Apple Sign In support
fix(subscription): handle purchase cancelled gracefully
refactor(home): extract session card into separate component
chore: update expo sdk to 52
```

Rules:
- Max 72 characters in subject line
- Use imperative mood: "add" not "added" or "adds"
- No period at the end
- Reference issue numbers when relevant: `fix(rls): correct policy for user_progress (#42)`

---

## Branch Naming

```
feature/short-description
fix/short-description
refactor/short-description
chore/short-description
```

Examples:
```
feature/achievement-modal
fix/home-screen-freeze
refactor/supabase-client
chore/upgrade-expo-52
```

---

## What the Agent Should NOT Do

- Never commit directly to `main` or `master`
- Never commit `.env`, `.env.local`, or any file containing secrets
- Never include `node_modules`, `.next`, `dist`, or build artifacts in commits
- Never make a commit that includes unrelated changes — one logical change per commit
- Never force-push to shared branches

---

## Before Committing (Mental Checklist)

1. Does this diff contain only what was asked?
2. Are there any secrets, tokens, or personal data in the diff?
3. Are there debug `console.log` statements that should be removed?
4. Does the commit message clearly describe the change?
