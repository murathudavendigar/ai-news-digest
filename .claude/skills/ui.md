# Skill: UI Components

Use this skill when building or modifying UI components, screens, or layouts.

---

## Component Philosophy

- **One component, one responsibility** — if a component does two unrelated things, split it
- **Dumb components are better** — push logic up or into hooks; keep render functions declarative
- **Props over context** for local state — only use Context or a global store when prop drilling goes 3+ levels deep
- **Composition over configuration** — prefer `children` and slot patterns over complex prop APIs

---

## Required States

Every interactive UI element must handle all four states:

| State | Requirement |
|-------|-------------|
| **Loading** | Show a skeleton, spinner, or disabled state — never an empty void |
| **Empty** | Show a meaningful empty state with a clear call to action |
| **Error** | Show a human-readable message with a retry option where possible |
| **Success** | The actual content — make sure it handles edge cases (very long text, missing image, etc.) |

Do not ship a component that only handles the happy path.

---

## Accessibility

- All interactive elements must be keyboard/VoiceOver accessible
- Buttons must have a text label or `accessibilityLabel`
- Images must have `alt` text (web) or `accessibilityLabel` (native)
- Touch targets on mobile must be at least 44×44 points
- Never use color as the only way to convey meaning

---

## React Native Specifics

- Use `Pressable` over `TouchableOpacity` for new components — it gives better control over press states
- `FlatList` for any list that could have more than ~20 items
- `KeyboardAvoidingView` for any screen with a text input
- `ScrollView` must have `showsVerticalScrollIndicator={false}` unless the scroll indicator is meaningful to the user
- Animations: use `react-native-reanimated` for performance-critical animations, `Animated` only for simple ones

### NativeWind Patterns
```tsx
// Conditional classes — use cn() utility
import { cn } from '@/lib/utils';

<View className={cn('p-4 rounded-xl', isActive && 'bg-primary', isDisabled && 'opacity-50')} />

// Platform-specific classes
<View className="p-4 ios:pt-6 android:pt-4" />
```

---

## Web / Next.js Specifics

- Use `loading.tsx` and `error.tsx` route segments for page-level states
- Suspense boundaries around async Server Components that fetch data
- Prefer CSS transitions over JS-driven animations for simple hover/focus states

---

## Naming Conventions

```
components/
  ui/              ← generic, reusable primitives (Button, Card, Modal)
  [feature]/       ← feature-specific components (SessionCard, AchievementBadge)

screens/ or app/   ← screen-level components — thin, just compose smaller components
hooks/             ← useXxx.ts — custom hooks, one hook per file
```

---

## Component Checklist Before Shipping

- [ ] All four states implemented (loading, empty, error, success)
- [ ] Works on small screens (375px / iPhone SE)
- [ ] Works with long/unexpected content (very long names, missing images)
- [ ] Accessible (labels, touch targets)
- [ ] No hardcoded colors — uses design tokens / theme
- [ ] No hardcoded strings — uses i18n keys if the project supports localization
- [ ] Keyboard/back button behavior is correct (native)
