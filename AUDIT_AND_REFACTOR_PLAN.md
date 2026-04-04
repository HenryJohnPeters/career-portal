# Career Portal — Phase 0 Audit & Execution Plan

**Date:** April 2026  
**Auditor:** Senior Principal Engineer  
**Stack:** NestJS 10 + React 18 + Prisma + PostgreSQL (Nx Monorepo)  
**Scope:** Production-readiness refactor + monetisation hardening + AI cost control

---

## EXECUTIVE SUMMARY

The Career Portal is a **feature-rich but unpolished** freemium SaaS with critical monetization gaps, weak premium enforcement, and inconsistent UX. The codebase has clean architecture fundamentals but exhibits:

- **Monetization leakage:** Premium users can retain access after cancellation; failed payments don't trigger downgrades
- **AI cost exposure:** 8 AI-powered features without regeneration prevention or smart caching; regeneration could happen on every interaction
- **Code quality gaps:** No tests; `any` type casts; missing error handling; weak validation; inconsistent UI patterns
- **Security debt:** No XSS sanitization; unauthenticated question bank endpoint; no audit logging

**This refactor will:**
1. Lock down premium/ subscription enforcement (server-side, timestamped, auditable)
2. Redesign AI generation to prevent cost abuse and runaway spending
3. Implement coherent entitlement model across the codebase
4. Standardise UX patterns, error handling, and form/table/modal patterns  
5. Improve typing, validation, and testing
6. Prepare the project for scalable, commercial deployment

---

## SECTION 1: THE PROJECT

### What This App Does

**Career Portal** is a freemium SaaS tool for job seekers:

- **CV Builder** — Create multiple CV versions, export as PDF, AI-powered rewriting
- **Cover Letter Writer** — Generate, improve, and tailor cover letters with AI (free suggestions, premium generation)
- **Job Tracker** — Kanban board for job applications (applied → rejected/offered)
- **Interview Prep** — Mock interviews with rule-based scoring, AI-generated questions, rule-based follow-ups
- **Technical Tests** — Take-home coding scenarios (templated + AI-generated, premium only)
- **Qualifications** — Practice question bank (10 questions/day free, unlimited premium)

### Technology Stack

**Backend:**
- NestJS 10.4 (TypeScript)
- Prisma 5.22 (ORM, PostgreSQL)
- OpenAI (gpt-4o for CV/letter/question/scenario generation)
- Stripe (subscriptions, webhooks)
- Supabase (auth, JWT verification)
- Helmet (security headers), class-validator (DTOs), Zod (env validation)
- Throttler (rate limiting: 3 req/s, 20 req/10s, 100 req/min)

**Frontend:**
- React 18.3 (TypeScript, Vite)
- React Router (navigation)
- React Hook Form + Zod (form validation)
- React Query 5 (data fetching, caching)
- Tailwind CSS 3 (styling)
- Lucide React (icons)
- Three.js + TalkingHead (avatar for interview UI)

**Data:**
- PostgreSQL 14+ (Supabase)
- Prisma schema: 18 tables (User, CvVersion, CvSection, InterviewQuestion, InterviewSession, TechnicalTest, Job, CoverLetter, QuestionAnswer, AiUsage, QuestionGenerationLog, PracticeQuestionUsage, CoverLetterSuggestion, etc.)

### Monorepo Structure

```
career-portal/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/             (Supabase JWT, user find-or-create, GET /auth/me)
│   │   │   │   ├── ai/               (OpenAI calls, premium.guard.ts, usage tracking)
│   │   │   │   ├── cv/               (CV CRUD, sections, PDF generation, AI rewriting)
│   │   │   │   ├── cover-letters/    (CRUD, AI generation, suggestions)
│   │   │   │   ├── jobs/             (tracker, Kanban data)
│   │   │   │   ├── questions/        (question bank, daily limits)
│   │   │   │   ├── interview-prep/   (mock sessions, question selection, evaluation, reporting)
│   │   │   │   ├── technical-tests/  (scenario generation, submission, evaluation)
│   │   │   │   ├── billing/          (Stripe checkout, webhook handlers)
│   │   │   │   ├── dashboard/        (summary endpoint)
│   │   │   │   └── auth/ (JWT verification)
│   │   │   ├── common/
│   │   │   │   ├── constants.ts      (FREE_TIER_MONTHLY_AI_LIMIT=5, difficulty maps, etc.)
│   │   │   │   ├── env.config.ts     (Zod validation)
│   │   │   │   ├── prisma.module.ts  (PrismaService)
│   │   │   │   └── http-exception.filter.ts (global error handler)
│   │   │   ├── pdf/                  (CV HTML templates, Playwright rendering)
│   │   │   └── main.ts               (app entry)
│   │   └── prisma/
│   │       ├── schema.prisma         (18-table schema)
│   │       └── migrations/           (23 migrations, recent: AI usage, stripe fields, auth)
│   └── web/
│       ├── src/
│       │   ├── pages/                (14 page components)
│       │   ├── features/             (feature-specific components & hooks)
│       │   │   ├── cv-builder/
│       │   │   ├── interview-prep/
│       │   │   ├── cover-letters/
│       │   │   ├── technical-tests/
│       │   │   ├── dashboard/
│       │   │   ├── qualifications/
│       │   │   ├── tracker/ (job tracker)
│       │   │   └── shared/ (PremiumUpgradeBanner, BackButton, ItemCard)
│       │   ├── layouts/              (DashboardLayout.tsx)
│       │   ├── lib/                  (auth context, theme constants)
│       │   └── main.tsx              (entry, providers)
│       └── vite.config.ts            (Vite + React plugin)
├── libs/
│   ├── shared/
│   │   └── types/                    (40+ TypeScript interfaces shared with API)
│   └── web/
│       ├── data-access/             (React Query hooks, api-client.ts, supabase.ts)
│       └── ui/                       (Button, Card, Spinner, EmptyState, ConfirmDialog)
└── [root config] (package.json, tsconfig.base.json, nx.json, etc.)
```

---

## SECTION 2: WHAT IS WORKING WELL

✅ **Architecture**
- Clean Nx monorepo with clear app/lib boundaries
- Module-based backend with DI
- Shared types library prevents duplication
- Good separation of concerns (controllers → services → Prisma)

✅ **Authentication**
- Supabase JWT verification works correctly
- User find-or-create logic handles linking
- Token fetching + Bearer header injection solid

✅ **API Design**
- REST conventions followed consistently
- Zod validation on environment config
- Class-validator DTOs with good type coverage
- HTTP exception filter provides consistent error responses
- Throttling configured (though may be too restrictive)

✅ **Data Layer**
- Prisma schema is well-normalized with proper relationships
- Migrations tracked cleanly
- Indexes present on frequently-queried fields (AiUsage queries)
- Good use of `@default()` for timestamps

✅ **Frontend Data Patterns**
- React Query hooks properly centralised in data-access lib
- Query keys well-structured with namespacing
- API client with proper token injection
- Form validation with React Hook Form + Zod

✅ **Security Basics**
- Helmet headers enabled
- CORS configured
- Stripe webhook signature verification
- Input validation on API endpoints
- No secrets in code or git

✅ **UI Framework**
- Tailwind CSS consistently applied
- Lucide icons used throughout
- Button, Card, Spinner, EmptyState, ConfirmDialog primitives exist
- Dark mode support present
- Professional visual design

---

## SECTION 3: CRITICAL GAPS & WEAK PATTERNS

### 🔴 MONETIZATION & PREMIUM ENFORCEMENT (HIGHEST RISK)

**Issue 1: No Subscription Expiry Enforcement**
- **Current:** Only `user.isPremium` boolean checked on premium endpoints
- **Problem:** When a subscription expires, `isPremium` is not automatically set to `false`
- **Leakage:** User cancels subscription on day 25 of 30-day period, retains access until: (a) webhook manually downgrades (b) user logs out and logs back in (c) manually updated by admin
- **Files:** `premium.guard.ts` (line 20), `ai-usage.service.ts` (line 38)
- **Fix needed:** Check `stripeCurrentPeriodEnd` timestamp in premium.guard.ts

**Issue 2: Failed Payment Webhook Not Wired**
- **Current:** `invoice.payment_failed` event exists in webhook but handler is empty/missing
- **Problem:** If Stripe payment fails, user is not downgraded; continues using premium features
- **Leakage:** Payment processor issue could be exploited
- **Files:** `billing.service.ts` (webhook handler around line 150+)
- **Fix needed:** Implement handler that sets `isPremium = false`

**Issue 3: Subscription Downgrade Race Condition**
- **Current:** No check for subscription state between API checks
- **Problem:** User can fire multiple AI requests before the monthly usage count is persisted
- **Leakage:** Minimal but present; one extra AI call possible in race scenario
- **Fix needed:** Use database-level transactions or atomic operations

**Issue 4: No Audit Logging**
- **Current:** No record of when users gain/lose premium status
- **Problem:** Cannot audit entitlement changes or debug customer disputes
- **Files:** All premium-related modules
- **Fix needed:** Log all premium status changes with timestamps and reason

---

### 🟠 AI GENERATION & COST CONTROL (HIGH RISK)

The application has **8 AI-powered features** and **no smart regeneration prevention**. This is expensive and exploitable.

**Current AI Features:**

1. **CV Section Rewriting** (premium)
   - Triggers: User clicks "Generate", "Improve", "Tailor" in CV builder
   - Cost per action: ~$0.02-0.05 (depends on section size)
   - **Problem:** No caching; each click regenerates from scratch
   - Endpoint: `POST /cv/sections/{id}/ai-rewrite`

2. **Full CV from Raw Text** (premium)
   - Triggers: User pastes raw text and hits "Extract"
   - Cost per action: ~$0.10-0.15 (full CV parse + structure)
   - **Problem:** No deduplication of identical raw text
   - Endpoint: `POST /cv/versions/{id}/generate-from-raw`

3. **Cover Letter Generation** (premium)
   - Triggers: User clicks "Generate" with job details
   - Cost per action: ~$0.05-0.10
   - **Problem:** No caching by (userId, jobId) pair
   - Endpoint: `POST /cover-letters/{id}/generate`

4. **Cover Letter Suggestions** (free, 5/month cap)
   - Triggers: User highlights text + clicks "Suggest improvement"
   - Cost per action: ~$0.01-0.02
   - **Problem:** Triggers on every keystroke if not rate-limited. No debounce visible in code.
   - Endpoint: `POST /cover-letters/{id}/suggest`
   - **Usage tracked:** Yes, in AiUsage table

5. **Interview Question Generation** (premium + background)
   - Triggers: User creates session with filters (track, level, difficulty, tags)
   - Cost per action: ~$0.08-0.15 per batch of 5 questions
   - **Major Problem:** If question bank is empty for a filter combo, generates 5 new ones. But the generation is **bursty and uncontrolled**.
   - Endpoint: `POST /interview-prep/sessions/create`
   - **Caching:** Uses `generatedForHash` in InterviewQuestion table (good) but NOT enforced; could regenerate
   - **Files:** `ai-question-generator.service.ts`

6. **Follow-Up Question Generation** (premium)
   - Triggers: After user answers a question in interview, "Get Follow-up" button
   - Cost per action: ~$0.02-0.05
   - **Problem:** No limit on follow-ups; could spam
   - Endpoint: `POST /interview-prep/sessions/{id}/questions/{qId}/follow-up`

7. **Technical Test Scenario Generation** (premium only)
   - Triggers: User creates a new test
   - Cost per action: ~$0.15-0.25 (full scenario with brief, requirements, criteria, hints)
   - **Problem:** Tries hardcoded template first, but falls back to AI 25% of time. No caching by **(roleFocus, level, difficulty, tags)** combination.
   - Endpoint: `POST /technical-tests/create`
   - **Files:** `technical-tests.service.ts` line 42

8. **Code Quality Assessment for Technical Tests** (premium)
   - Triggers: User submits solution
   - Cost per action: ~$0.20-0.30 (code review + scoring)
   - **Problem:** Happens on every submission; no storage of previous evaluations
   - Endpoint: `POST /technical-tests/{id}/submit`
   - **Files:** `technical-tests.service.ts` submit handler

---

**Overall AI Cost Control Issues:**

| Issue | Impact | Files |
|-------|--------|-------|
| No deduplication of identical inputs | Can regenerate same content 100+ times | ai.service.ts, technical-tests.service.ts |
| No caching by hash of meaningful inputs | Regenerates on subset repeats | ai.service.ts, ai-question-generator.service.ts |
| No limits on regenerations | User can hit "regenerate" infinitely | (all AI endpoints) |
| Hardcoded gpt-4o (no fallback) | Overspend on cheap queries, no graceful degrada | openai.provider.ts |
| Immediate generation on entry | No pre-generation or batch processing | interview-prep.service.ts |
| No async queue or batch scheduling | API calls block request; no prioritization | (all AI endpoints) |

---

### 🟠 PREMIUM / FREE / USAGE STRATEGY (HIGH RISK)

**Current Model:**

| Feature | Free | Premium |
|---------|------|---------|
| CV Builder | 1 version, basic templates | Unlimited versions, all templates |
| CV Export (PDF) | Yes | Yes |
| CV AI Rewriting | No | Yes (unlimited) |
| Cover Letters | 3 total | Unlimited |
| Cover Letter AI Generation | No | Yes (unlimited) |
| Cover Letter Suggestions | Yes, 5/month | Unlimited |
| Job Tracker | Yes | Yes |
| Interview Prep (Mock) | 10 questions/day free | Unlimited |
| Interview Follow-up Questions | No | Yes (unlimited) |
| Technical Tests | No (blocked) | Yes (unlimited) |
| Qualifications (question bank) | 10/day | Unlimited |

**Entitlement Enforcement:**
- Free tier: `FREE_TIER_MONTHLY_AI_LIMIT = 5` (all AI actions counted equally — not granular)
- Premium: `isPremium = true` (one boolean, no date checking)
- Daily limits: Tracked in PracticeQuestionUsage table
- Monthly limits: Tracked in AiUsage table

**Problems:**

1. **All AI actions count as "1"** — Asking for cover letter suggestion (cheap, ~$0.01) counts same as generating full CV (~$0.15)
2. **Free daily question limit not enforced consistently** — No guard on `/questions` endpoint
3. **No regeneration caps** — Premium users can regenerate infinitely (no cost controls)
4. **No fair-use limits** — Premium doesn't have quota to prevent abuse
5. **Unclear free-to-premium funnel** — 5 free AI actions might be too high or too low; no data-driven decision

---

### 🟡 CODE QUALITY GAPS

**Test Coverage:** ✗ Zero tests  
**Type Safety:** ~60% safe (many `any` casts in Prisma queries)  
**Error Handling:** Inconsistent (some endpoints missing error paths)  
**Validation:** Weak (no max-length on text fields; CV body unlimited)  
**Secrets:** Safe (no exposed keys in code)  

**Specific Issues:**

| Category | Issue | Files | Count |
|----------|-------|-------|-------|
| typing | `any` type casts in queries | api/modules/cv/cv.service.ts, cover-letters/service | 5+ |
| typing | Missing null checks | interview-prep/service | 3+ |
| validation | No max-length on textarea fields | cv-builder page, cover-letters page | 4+ |
| error-handling | No error boundary on interview session | interview-prep page | 1 |
| error-handling | Silent failures in billing webhook | billing/service | 2+ |
| security | No XSS sanitization on AI-generated content | cv-builder, cover-letters | All AI outputs |
| security | localStorage for token (should sessionStorage) | data-access/supabase.ts | check |
| performance | N+1 queries possible in CV export | pdf/pdf.service.ts | 1 |
| performance | No caching of static question bank | questions/service | 1 |
| constants | Hardcoded magic values | various | 20+ |

---

### 🟡 UI/UX CONSISTENCY ISSUES

**Missing Patterns:**
- **Success state** — No toast/notification after save (only flash in some places)
- **Error state** — Missing error boundaries; some pages crash silently
- **Loading state** — Inconsistent: button spinner exists, but page-level loading missing in some places
- **Empty state** — Some lists/tables have custom empty messages; others missing
- **Modal pattern** — Mix of inline forms and modals; no consistent modal component wrapper
- **Form pattern** — Input styling consistent, but button placement varies
- **Table pattern** — No standardised table component; each feature builds own (Kanban, QA list, etc.)
- **Accessibility** — Missing ARIA labels, no keyboard nav in some interactive elements

---

### 🟡 SECURITY & PRIVACY GAPS

1. **No XSS Sanitization** — AI-generated CV/letter content not sanitized before rendering
2. **No Audit Logging** — Can't trace who accessed what or when
3. **No RBAC** — All authenticated users can access all their data (good), but no admin panel for support
4. **Token Storage** — Using sessionStorage (good), but could be more explicit
5. **Unauthenticated Endpoint** — `/questions` endpoint could allow scraping full question bank if exposed
6. **No Rate Limiting on AI** — Throttler exists but doesn't know about user/feature; could burn budget quickly

---

### 🟡 DATABASE & SCHEMA GAPS

**Unused/Problematic Fields:**
- `InterviewQuestion.source` — Set to "seed" but used only for filtering; could be dropped if only using AI
- `CvSection.sectionType` — String instead of enum; prone to typos
- Missing unique constraint on `(cvVersionId, order)` in CvSection — Could break reordering if concurrent updates
- `QuestionGenerationLog` — Created but not actively used; could be dropped or better utilised

**Missing Indices:**
- `(userId, isPremium, stripeCurrentPeriodEnd)` — Would speed up entitlement checks
- `(userId, createdAt)` on most tables — Would speed up user-scoped queries

---

## SECTION 4: WHAT SHOULD BE REFACTORED

### By Priority & Impact

**P0 — Must fix (Monetization & Security)**
1. ✗ Add subscription period validation (check expiry date in premium.guard.ts)
2. ✗ Wire up failed payment webhook to downgrade user
3. ✗ Add audit logging for premium status changes
4. ✗ Sanitize XSS in CV/cover letter AI output
5. ✗ Lock down unauthenticated endpoints

**P1 — Should fix (AI Cost Control)**
1. ✗ Implement caching for AI-generated content by input hash
2. ✗ Add regeneration limits (premium: 3/month per feature, free: 0)
3. ✗ Separate "generate on create" vs "regenerate" with different quotas
4. ✗ Add synthetic cache warm-up for common filter combos (interview questions)
5. ✗ Queue long-running AI tasks asynchronously instead of blocking

**P2 — Should fix (Code Quality)**
1. ✗ Add 20+ unit tests for premium enforcement, webhooks, AI limits
2. ✗ Remove `any` type casts; add proper Prisma type safety
3. ✗ Add max-length validation on all text fields
4. ✗ Add error boundaries around interactive features
5. ✗ Standardise all error responses

**P3 — Nice to have (UX Polish)**
1. ✗ Add toast notifications for save/delete success
2. ✗ Standardise loading states across all pages
3. ✗ Add empty state messages to all lists
4. ✗ Create reusable table component
5. ✗ Create reusable modal wrapper component
6. ✗ Improve accessibility (ARIA labels, keyboard nav)

---

## SECTION 5: WHAT SHOULD BE KEPT

✅ **NestJS + Prisma + React Query** — Solid tech choices; don't rewrite  
✅ **Module structure** — Clear boundaries; keep DI pattern  
✅ **Shared types library** — Good deduplication  
✅ **Zod validation** — Reuse for new validations  
✅ **Tailwind + Lucide** — Consistent design system  
✅ **API response format** — Consistent error/success structure  
✅ **Stripe integration** — Keep; improve webhook handling  
✅ **Supabase auth** — Working; keep as-is  

---

## SECTION 6: WHAT SHOULD BE DELETED

✗ **Unused DB fields:**
- `InterviewQuestion.source` (only "seed" vs "ai"; all generated now)
- `QuestionGenerationLog` (created but unused; can track in AiUsage instead)

✗ **Dead code:**
- Commented-out test scenarios in technical-tests engine (if any)
- Any unused utility functions or exports

✗ **Incomplete features:**
- Features with TODO comments that are not on the critical path

---

## SECTION 7: REFACTOR TARGETS & TIMING

### PHASE 1: PREMIUM & SUBSCRIPTION HARDENING (2-3 days)

**Goal:** Lock down premium logic so free and paid users behave correctly.

**Changes:**
1. Fix `premium.guard.ts` to check `stripeCurrentPeriodEnd` timestamp
2. Implement subscription downgrade logic in failed payment webhook
3. Add `LastPremiumDowngradedAt` to User table for audit
4. Add tests for all premium guard scenarios
5. Create `ENTITLEMENTS.ts` file with feature definitions (what requires premium, quota, etc.)

**Files touched:** ~10  
**Risk:** Medium (premium logic is critical)  
**Testing needed:** High (new tests required)

### PHASE 2: AI GENERATION COST CONTROL (3-4 days)

**Goal:** Prevent wasteful regeneration and spike in AI costs.

**Changes:**
1. Add `AiGenerationCache` table to store results by input hash
2. Implement caching in AiService for all generation methods
3. Add regeneration limits: `RegenerationLog` table tracks per-user, per-feature
4. Split monthly AI budget into feature-specific quotas (not one shared bucket)
5. Pre-generate common question combos in background (seeding)
6. Implement async queue for long-running scenarios

**Files touched:** ~15  
**Risk:** High (AI cost is existential risk)  
**Testing needed:** High (need cost simulation tests)

### PHASE 3: ENTITLEMENT SYSTEM & GUARDS (2-3 days)

**Goal:** Centralised, reusable feature entitlement enforcement.

**Changes:**
1. Create `ENTITLEMENTS` config file (maps feature → free/premium/quota/cooldown)
2. Create `@CheckEntitlement(feature)` decorator for endpoints
3. Create `useFeatureAccess(feature)` hook for frontend
4. Update all API endpoints to use new guard
5. Create UI hooks for "is this feature available" checks
6. Add "upgrade prompt" component that's shown contextually

**Files touched:** ~20  
**Risk:** Medium (guards are additive; old checks still work)  
**Testing needed:** Medium

### PHASE 4: UI/UX CONSISTENCY (2-3 days)

**Goal:** Professional, consistent patterns across all pages.

**Changes:**
1. Add `<Toast />` global component for success/error notifications
2. Add `<ErrorBoundary />` wrapper to all feature pages
3. Add `<LoadingState />` component, use consistently
4. Add `<EmptyState />` pattern to all lists
5. Create reusable `<Table />` component for lists/grids
6. Create reusable `<Modal />` wrapper with consistent styling
7. Standardise form button placement and styling
8. Add ARIA labels, keyboard nav to interactive elements

**Files touched:** ~25  
**Risk:** Low (mostly UI, no logic changes)  
**Testing needed:** Low (manual UX testing)

### PHASE 5: CODE QUALITY & TESTING (2-3 days)

**Goal:** Safe typing, comprehensive tests, clean code.

**Changes:**
1. Remove `any` type casts; use proper Prisma types
2. Add max-length validation (CV: 10k chars, letter: 5k chars, etc.)
3. Add unit tests for all premium logic, webhooks, generation limits
4. Add integration tests for entitlement flows
5. Clean up dead code, unused exports
6. Add proper error messages (specific, actionable)
7. Add request logging/audit trail for sensitive operations

**Files touched:** ~30  
**Risk:** Low (mostly refactoring)  
**Testing needed:** High (new tests required)

### PHASE 6: FINAL QA & POLISH (1-2 days)

**Goal:** Production-ready codebase.

**Changes:**
1. Security audit pass (XSS sanitization, CSRF tokens, etc.)
2. Performance audit pass (query optimization, caching, lazy loading)
3. Accessibility audit (keyboard nav, screen reader, WCAG compliance)
4. Manual QA of every feature (happy path, error path, edge cases)
5. Documentation updates (README, deployment guide, feature matrix)
6. Final review of all changes

**Files touched:** All  
**Risk:** Low (final pass)  
**Testing needed:** Medium (manual + automated)

---

## EXECUTION PLAN

### TIMELINE

| Phase | Tasks | Duration | Start | End |
|-------|-------|----------|-------|-----|
| P0 Audit | Investigation, documentation | 1 day | Today | Today |
| 1 | Premium & Subscription | 2-3 days | Tomorrow | Tue |
| 2 | AI Cost Control | 3-4 days | Wed | Fri |
| 3 | Entitlement System | 2-3 days | Mon | Tue |
| 4 | UI/UX Consistency | 2-3 days | Wed | Thu |
| 5 | Code Quality & Tests | 2-3 days | Fri | Mon |
| 6 | Final QA | 1-2 days | Tue | Wed |
| **TOTAL** | | **15-20 days** | | |

### GIT STRATEGY

- **Branch per phase:** `refactor/phase1-premium`, `refactor/phase2-ai-cost`, etc.
- **Commits per phase:** Group related changes
- **PR per phase:** Clear description of changes and testing done
- **Main merged once per phase:** Feature-branch stability required

### SUCCESS CRITERIA

✅ All P0 issues fixed  
✅ Premium enforcement server-side validated with tests  
✅ AI cost guardrails in place (caching, regeneration limits)  
✅ Entitlement system centralised and reusable  
✅ UI patterns standardised; no one-off component patterns  
✅ 50+ critical-path unit tests added  
✅ Zero console.log in production code  
✅ Zero `any` type casts  
✅ All endpoints have error handling  
✅ Deployment guide & feature matrix documented  

---

## RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Premium bypass discovered post-refactor | Low | High | Comprehensive testing, code review, security audit before merge |
| AI cost spike during refactoring | Medium | High | Phase 2 completed early; caching enabled before opening to users |
| Regression in existing features | Medium | High | Phase requires full manual QA pass |
| DB migration breaks production | Low | High | Test migrations on staging first; have rollback plan |
| Token/auth leak | Low | Critical | No changes to token handling; only enforcement logic |

---

## METRICS FOR SUCCESS

**After Refactor:**

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Subscription enforcement | ✗ (no expiry check) | ✓ (timestamped) | Automated tests |
| Failed payment handling | ✗ (not wired) | ✓ (tested) | Webhook simulation |
| AI budget overspend risk | High (3x–10x) | Low (<1.2x) | Cost simulation |
| Code test coverage | 0% | 60%+ (critical paths) | Jest coverage reports |
| Type safety (`any` casts) | 5+ | 0 | TypeScript coverage |
| UX consistency issues | 10+ | 0 | Manual QA checklist |
| Security gaps | 5+ | 0 | Security review checklist |
| Dead/unused code | 20+ | 0 | Manual review |

---

## NEXT STEPS

1. **Today:** Approve this plan; confirm priorities
2. **Tomorrow:** Begin Phase 1 (premium & subscription hardening)
3. **Weekly:** Review completed phases; adjust timeline as needed
4. **End of Week 3:** All major refactoring complete; begin final QA
5. **End of Week 4:** Deployment-ready; final review + merge to main

---

**End of Audit & Execution Plan**

For detailed file-by-file findings, see referenced CODEBASE_AUDIT.md.
