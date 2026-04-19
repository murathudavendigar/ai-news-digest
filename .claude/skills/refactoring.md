# Skill: Refactoring

Use this skill when restructuring, cleaning up, or improving existing code without changing behavior.

---

## The Cardinal Rule

**Refactoring must not change behavior.** If behavior changes, that is a bug or a feature — not a refactor. Keep them separate.

---

## Before You Start

1. **Understand what the code does** before touching it — read it fully
2. **Identify why it's being refactored** — readability? performance? reducing duplication?
3. **Check for tests** — if there are tests, they must all pass after the refactor
4. **Agree on scope** — refactoring one function is very different from restructuring a module

---

## Safe Refactoring Techniques

### Extract Function
When a block of code does one distinct thing, extract it:
```typescript
// Before
function processOrder(order) {
  // 20 lines calculating total
  // 15 lines sending email
}

// After
function processOrder(order) {
  const total = calculateOrderTotal(order);
  await sendOrderConfirmationEmail(order, total);
}
```

### Rename for Clarity
Rename when the current name is misleading or too vague:
- `data` → `userSessions`
- `handlePress` → `handleStartSession`
- `flag` → `isSubscriptionActive`

### Remove Dead Code
Delete code that is never called. Check carefully:
- Is it exported and used outside this file?
- Is it a callback that gets passed somewhere?
- Is it behind a feature flag that might be re-enabled?

If unsure, comment it out first and flag for review — don't delete immediately.

### Reduce Nesting
Flatten deeply nested logic with early returns:
```typescript
// Before — arrow anti-pattern
function getDisplayName(user) {
  if (user) {
    if (user.profile) {
      if (user.profile.displayName) {
        return user.profile.displayName;
      }
    }
  }
  return 'Anonymous';
}

// After — early returns
function getDisplayName(user) {
  if (!user?.profile?.displayName) return 'Anonymous';
  return user.profile.displayName;
}
```

### Consolidate Duplicate Logic
When you see the same logic in 2+ places, extract it once. The rule of three: duplicate once (OK), duplicate twice (extract it).

---

## What NOT to Do During a Refactor

- Don't change variable/function names and behavior in the same commit
- Don't switch to a different library mid-refactor ("while I'm here, let me replace axios with fetch")
- Don't add new features ("while I'm here, let me also add error handling")
- Don't change the public API of a function without updating all call sites
- Don't reorganize files and rename things in the same PR — it makes diffs unreadable

---

## Refactor Checklist

- [ ] Behavior is identical before and after
- [ ] All existing tests still pass
- [ ] No unrelated changes in the diff
- [ ] New names are more descriptive than old names
- [ ] No new `any` types introduced
- [ ] File length is the same or shorter
- [ ] The refactored code is easier to read in 3 months
