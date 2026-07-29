# HaberAI — Reliability + Digest Family Design

**Date:** 2026-07-29  
**Status:** Approved (no commit/push per user)  
**Approach:** Surgical reliability + digest-family UI for home/detail

## Goals

1. Restore AI analyze/summarize reliability with free-tier providers only.
2. Keep `/digest` as the gold-standard surface; do not rewrite it.
3. Align home + news detail with digest visual language (serif, stone, single accent).
4. Keep useful Magic UI pieces (BlurFade); remove glow/sparkles/purple marketing chrome.

## Constraints

- Free models only for all AI providers.
- No new dependencies without asking.
- npm only.
- Tailwind utilities; prefer CSS tokens already in `globals.css`.
- No commit or push.

## Part 1 — AI fallback & cache

### Current failure mode

Chain: Groq → Cerebras → SambaNova → OpenRouter.

Observed:

- Groq: frequent 429 (still works when not limited)
- Cerebras: 404 — `llama3.1-8b` removed from public catalog
- SambaNova: 402 — payment method required
- OpenRouter: 404 — `meta-llama/llama-3.3-70b-instruct:free` discontinued (~2026-07-19)

Cache HIT paths are fine. Cache MISS exhausts the dead chain and returns 500.

### Target behavior

1. **Provider order (unchanged):** groq → cerebras → sambanova → openrouter
2. **Free model IDs (updated):**
   - Groq: keep free-tier Llama models (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, scout)
   - Cerebras: `gemma-4-31b` (FAST/BALANCED), `gpt-oss-120b` (SMART) — current public catalog
   - SambaNova: keep Llama IDs; treat 402 as long cooldown (free tier unavailable until fixed)
   - OpenRouter: primary `openrouter/free`; fallbacks `google/gemma-4-31b-it:free`, `openai/gpt-oss-20b:free`, `nvidia/nemotron-nano-9b-v2:free`
3. **OpenRouter headers:** `HTTP-Referer` (site URL), `X-Title` (HaberAI)
4. **Redis cooldown:** on 401/402/404 (model unavailable) skip provider for 30–60 min; on 429 short wait then next; missing key → silent skip
5. **Intra-provider model fallback:** if primary model 404, try next model in that provider’s free list before leaving provider
6. **Cache:** preserve existing Redis summary/analyze TTLs (7d); never bypass on success
7. **API errors:** return structured JSON error messages suitable for retry UI (no stack leaks)

### Out of scope (AI)

- Paid OpenRouter / paid SambaNova
- Rewriting Gemini digest pipeline (already solid)
- New queue/worker infrastructure

## Part 2 — Homepage (digest family)

### Remove

- `homepage-v2-glow`, blue radial gradients, Signal panel, purple/blue pill badges, sparkles aesthetic

### Keep / refine

- Breaking banner, DailyDigestCard, TodaysColumnistCard, HomeNewsFeed (BlurFade), WorldNewsStrip, MarketWidget
- Layout: main + sticky sidebar

### New hero

- Brand-first: HaberAI
- One headline + one supporting line
- Primary CTA → `/digest`
- Secondary meta: date / mood strip feel (editorial, not SaaS)

### Visual tokens

- Fonts: Playfair Display + Source Serif 4 (existing)
- Surfaces: stone palette, hairline borders, minimal radius (less “cardy” than current v2)
- Accent: amber brand + red for breaking only
- Motion: BlurFade / soft reveal only

## Part 3 — News detail

- Same typography/tokens as home
- Stronger empty state (“baskıda yok”) with back links
- Softer analysis containers (less heavy rounded cards)
- Keep DeepAnalysis lazy fetch; improve error/retry copy
- External “Kaynağa Git” as text/secondary, not oversized pill

## Explicitly untouched

- `/digest` page content/layout
- Columns, admin, settings (except shared token cascade)
- Adding Magic UI packages beyond what is already installed

## Success criteria

- Analyze/summarize succeeds when Groq is 429 by falling through to a working free provider
- Dead providers are not retried every request (cooldown)
- Home no longer looks like generic AI landing; reads as HaberAI editorial sibling of digest
- Detail page matches that family; failed AI shows retry, not opaque 500 UX
