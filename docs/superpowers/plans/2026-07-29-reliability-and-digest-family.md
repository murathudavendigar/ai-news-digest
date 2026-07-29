# Reliability + Digest Family Implementation Plan

> **For agentic workers:** Implement task-by-task. No commit/push unless user asks.

**Goal:** Fix free-tier AI fallback/cache failures, then align home + news detail with `/digest` visual language.

**Architecture:** Harden `src/app/lib/groq.js` (models, OpenRouter headers, Redis cooldown, intra-provider fallback). Restyle home (`page.js`, `globals.css`, related cards) and polish `news/[slug]/page.jsx` without touching digest content.

**Tech Stack:** Next.js App Router, Tailwind v4, Upstash Redis, existing Groq/Cerebras/SambaNova/OpenRouter chain.

## Global Constraints

- Free models only for all AI providers
- No new npm dependencies
- Do not rewrite `/digest`
- No commit or push
- Prefer existing CSS tokens; strip purple/glow/sparkles chrome

---

### Task 1: Fix AI provider chain

**Files:** `src/app/lib/groq.js`

- [ ] Update Cerebras models to `gemma-4-31b` / `gpt-oss-120b`
- [ ] Update OpenRouter to `openrouter/free` + free fallbacks; add Referer/Title headers
- [ ] Add Redis cooldown for 401/402/404; respect cooldown in FALLBACK_ORDER loop
- [ ] Try multiple free models per provider before moving on
- [ ] Verify via analyzing an article while Groq is rate-limited (dev logs)

### Task 2: Homepage digest family

**Files:** `src/app/page.js`, `src/app/globals.css`, optionally `DailyDigestCard.jsx`, `HomeNewsFeed.jsx`, `TodaysColumnistCard.jsx`, `BreakingNewsBanner.jsx`, `WorldNewsStrip.jsx`

- [ ] Replace marketing hero with brand-first editorial hero + CTA to `/digest`
- [ ] Remove glow / Signal panel / purple-blue badges from CSS + JSX
- [ ] Tone down card chrome toward hairline editorial surfaces
- [ ] Keep BlurFade in feed

### Task 3: News detail polish

**Files:** `src/app/news/[slug]/page.jsx` (+ light touches to analysis empty/error if needed)

- [ ] Align empty state and article chrome with digest family
- [ ] Soften oversized CTA; clearer back navigation
- [ ] Ensure analysis failure surfaces retry-friendly messaging

### Task 4: Smoke check

- [ ] Hit home, digest (unchanged), a news detail, trigger analyze
- [ ] Confirm OpenRouter/Cerebras no longer spam dead model 404 without cooldown
