# Core Rules

These rules apply to every project, every file, every change. No exceptions.

---

## 1. Code Integrity

- **Never silently remove or rename** exported functions, components, or types that are used elsewhere in the codebase
- **Never stub real logic** — if you can't implement something fully, say so instead of writing empty or fake implementations
- **Never assume** a library or API method exists without verifying it's in the project's dependencies
- **Preserve existing logic** when refactoring — behavior must be identical unless a change was explicitly requested
- If a file is longer than 300 lines, suggest splitting it. Don't do it automatically.

---

## 2. File Operations

| Action | Rule |
|--------|------|
| Create a new file | OK — but explain why a new file is needed |
| Edit an existing file | OK — keep the diff minimal |
| Delete a file | **Ask first**, always |
| Rename/move a file | **Ask first** — update all imports after confirmation |
| Install a new package | **Ask first** — propose the package + reason |

---

## 3. Response Format

- **Lead with the solution**, not an explanation of what you're about to do
- Keep explanations **after** the code, not before
- Use inline comments only when the logic is genuinely non-obvious
- Do not write summaries like "I've completed the task" at the end — just stop
- If producing multiple files, clearly label each one with its path

---

## 4. Error Handling

- Every async function must handle errors explicitly — no unhandled promise rejections
- Use typed errors where the stack supports it
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Error messages shown to users must be human-readable, not stack traces or raw API errors

---

## 5. Security

- **Never log sensitive data**: tokens, passwords, API keys, user PII
- **Never hardcode secrets** — use environment variables
- **Never trust user input** — validate and sanitize at the boundary
- When writing auth flows, security gates, or RLS policies: slow down, think twice, comment your reasoning

---

## 6. Performance

- Don't add `useEffect` without a clear reason
- Avoid unnecessary re-renders — think before spreading props or creating objects/arrays inline
- Large lists must be virtualized or paginated — never render 100+ items at once without discussion
- Images must have defined dimensions to avoid layout shift

---

## 7. What "Done" Means

A task is done when:
1. The code compiles without errors
2. The feature works as described
3. Edge cases are handled (empty state, loading state, error state)
4. No existing tests are broken
5. The diff contains no unrelated changes
