# Career Portal - Comprehensive Codebase Audit

**Date:** April 2026  
**Stack:** NestJS + React + Prisma + PostgreSQL (Nx Monorepo)  
**Scope:** Full-stack analysis with focus on architecture, premium logic, AI features, and code quality

---

## 1. ARCHITECTURE OVERVIEW

### Project Structure

```
apps/
  api/              — NestJS backend (port 3000)
  web/              — React Vite SPA frontend (port 4200)
libs/
  shared/
    types/          — TypeScript interfaces (shared across API & frontend)
  web/
    data-access/    — React Query hooks + API client
    ui/             — Reusable UI components & theme
```

### Module Boundaries

**API Modules** (all under `apps/api/src/modules/`):
- **auth** — Supabase JWT verification, user find-or-create, GET /auth/me
- **ai** — OpenAI integration (CV, cover letter generation), premium.guard.ts, usage tracking
- **cv** — CV version CRUD, section management, PDF generation, AI rewriting
- **cover-letters** — CRUD, AI generation, suggestion engine
- **jobs** — Job tracker (applied/rejected/offered status), Kanban data
- **questions** — Interview prep question bank, daily limits, practice usage
- **interview-prep** — Mock interview sessions, question selection, evaluation engine
- **technical-tests** — Take-home scenario generation (AI + templated)
- **billing** — Stripe integration (checkout, webhook handlers)
- **dashboard** — Summary endpoint
- **pdf** — CV to PDF rendering via Playwright + HTML templates

### Module Dependencies

```
AuthGuard (global requirement)
  ↓
PremiumGuard (on AI endpoints)
  ↓
AiUsageService (monthly cap tracking)
  ↓
AiService (OpenAI calls)
  ↓
PrismaService (data persistence)
```

**Frontend Data Flow:**
```
React Components
  ↓
React Query hooks (AppProvider wraps app)
  ↓
api-client (fetch + Bearer token)
  ↓
Supabase auth (getSession on startup)
  ↓
NestJS API
```

### Config Handling

- **Environment Variables** — Zod schema validation in [env.config.ts](apps/api/src/common/env.config.ts)
  - Required: `DATABASE_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
  - Optional: `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `ADMIN_API_KEY`
  - Defaults: `CLIENT_URL=http://localhost:4200`, `PORT=3000`, `NODE_ENV=development`
  - **⚠️ Issue:** Production env vars should never be committed; only .env.example present (good)

---

## 2. API DESIGN & ENDPOINTS

### REST Conventions

All endpoints follow REST principles with consistent response format:

```typescript
// Success
{ data: T }

// Error
{
  code: HttpStatus,
  message: string,
  details?: unknown,
  timestamp: ISO8601
}
```

### Authentication

All endpoints (except webhook) require `Authorization: Bearer <supabase_jwt>` header.  
**Guard Chain:**
1. `AuthGuard` (verifies token, sets `request.userId`)
2. Optional `PremiumGuard` (checks AI usage cap)
3. Endpoint handler with `@CurrentUserId()` decorator

### Endpoint Overview by Module

#### **Auth** (`/auth`)
- `GET /auth/me` — Current user profile
- `GET /auth/ai-usage` — Monthly AI usage status

#### **CV** (`/cv`)
- `GET /cv/versions` — List all CV versions
- `POST /cv/versions` — Create new CV (enforces `FREE_CV_LIMIT=1` for free users)
- `PATCH /cv/versions/:id` — Update CV metadata + contact fields
- `DELETE /cv/versions/:id`
- `POST /cv/versions/:id/duplicate`
- `POST /cv/versions/:id/ai-generate-full` [PremiumGuard] — Full CV from raw text
- `GET /cv/versions/:id/sections`
- `POST /cv/versions/:id/sections` — Create section (default types: profile, experience, education, skills, projects)
- `PATCH /sections/:id` — Update section content
- `DELETE /sections/:id`
- `POST /sections/:id/move` — Reorder sections
- `POST /sections/:id/ai-generate` [PremiumGuard] — AI rewrite/improve/tailor
- `GET /cv/pdf/:versionId` — Render PDF

#### **Cover Letters** (`/cover-letters`)
- `GET /` — List all cover letters
- `POST /` — Create (enforces `FREE_COVER_LETTER_LIMIT=3` for free users)
- `PATCH /:id` — Update
- `DELETE /:id`
- `POST /:id/suggest` [AI Usage check] — AI improvement suggestions
- `POST /:id/rewrite` [AI Usage check] — Full AI rewrite
- `POST /:id/ai-generate` [PremiumGuard] — Generate from job description

#### **Jobs Tracker** (`/jobs`)
- `GET /` — All jobs for user
- `POST /` — Create job entry
- `PATCH /:id` — Update status (applied/rejected/offer)
- `DELETE /:id`

#### **Interview Prep** (`/interview-prep`)
- `GET /options` — Available interviewer personas, difficulty levels, tech stacks
- `GET /sessions` — All sessions for user
- `POST /sessions` — Create session with filters
- `GET /sessions/:id` — Get session details
- `GET /sessions/:id/next` — Next question in session
- `POST /sessions/:id/questions/:questionId/answer` — Submit answer + get feedback
- `POST /sessions/:id/complete` — Finalize session, compute score/report
- `POST /admin/background-fill` [ADMIN_API_KEY] — Background task to pre-generate questions

#### **Questions / Practice** (`/questions`)
- `GET /` — All available practice questions (no auth needed, but checks daily limits on next)
- `GET /answers` — User's answers
- `PUT /:id/answer` — Save answer
- `GET /practice/usage` — Daily usage count
- `POST /practice/next` [Throttle 1/s, 30/min] — Get random question (enforces `FREE_DAILY_QUESTION_LIMIT=10`)
- `POST /practice/check` [Throttle 2/s, 60/min] — Validate answer locally (no auth)

#### **Technical Tests** (`/technical-tests`)
- `GET /` — All tests for user
- `POST /` [Premium only] — Create test (generates scenario)
- `GET /:id` — Get test
- `POST /:id/start` — Mark as in_progress, set startedAt
- `POST /:id/submit` — Save submitted solution
- `DELETE /:id`

#### **Billing** (`/billing`)
- `POST /checkout` — Create Stripe checkout session
- `POST /portal` — Create Stripe customer portal session
- `GET /status` — Subscription status (isPremium, periodEnd)
- `POST /webhook` [No Auth, Signature verified] — Stripe webhook handler (checkout.session.completed, invoice.payment_succeeded, subscription.updated, deleted)

### Input Validation

**DTOs use class-validator:**
- [cv/cv.dto.ts](apps/api/src/modules/cv/cv.dto.ts) — `IsString`, `MaxLength`, `IsUrl` (HTTPS only for photoUrl)
- [cover-letters/cover-letters.dto.ts](apps/api/src/modules/cover-letters/cover-letters.dto.ts) — Similar
- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`

**Type Safety:** Shared `types` package ensures frontend/backend consistency (39 exported interfaces)

---

## 3. FRONTEND DATA PATTERNS

### React Query Setup

**Query Keys Factory** ([query-keys.ts](libs/web/data-access/src/query-keys.ts)):
- Centralized query key definitions (prevents key mismatches)
- Scoped keys (e.g., `cvSections: (versionId) => ["cv-sections", versionId]`)

**Custom Hooks** ([hooks.ts](libs/web/data-access/src/hooks.ts)):
- `useMe()` — Fetch current user (controlled by AuthProvider)
- `useCvVersions()`, `useCreateCvVersion()`, `useUpdateCvVersion()`, etc.
- `useInterviewSessions()`, `useCreateInterviewSession()`
- `useSubscriptionStatus()`, `useCreateCheckoutSession()`
- `useAiUsage()`, `useAiGenerateCvSection()`, `useAiGenerateCoverLetter()`
- Pattern: mutations invalidate related queries on success

**API Client** ([api-client.ts](libs/web/data-access/src/api-client.ts)):
```typescript
const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?) => request<T>(path, { method: "POST", ... }),
  patch, put, delete (same pattern)
}
```
- Always includes Bearer token from `supabase.auth.getSession()`
- Throws on non-2xx status

### Auth Flow

[AuthProvider](apps/web/src/lib/auth.tsx):
1. On mount, wait for Supabase session restore
2. If session exists, fetch user from `/auth/me`
3. On auth state change (login/logout/session recovery):
   - If PASSWORD_RECOVERY event: skip user fetch (ResetPasswordPage handles it)
   - Otherwise: fetch or clear user
4. Expose `useAuth()` hook with { user, isAuthenticated, logout, isLoading }

**Client-side Route Protection:** `<ProtectedRoute>` requires user to be authenticated, shows Spinner while loading

### State Management

- **Form State:** React Hook Form + Zod validation (CV section form, job tracker, etc.)
- **Async State:** React Query (caching, refetch, mutations)
- **UI State:** Component-level useState (modals, dropdowns, error messages)
- **Global Auth:** React Context (AuthProvider)

### Loading/Error/Empty States

**Patterns Found:**
- ❌ **Inconsistent:** Some components show Spinner, others show skeleton, some nothing
- Example: [RawTextCvPanel.tsx](apps/web/src/features/cv-builder/components/RawTextCvPanel.tsx#L361) has `{/* Loading state */}` comment but minimal actual UX
- Example: [BillingPage.tsx](apps/web/src/pages/BillingPage.tsx#L50) shows `<Spinner />` before content loads
- ❌ **Missing:** Many mutation endpoints don't show loading state to user (AI generation does show `Loader2` icon)
- ✅ **Good:** Error messages shown directly from API response
- ✅ **Good:** Empty states exist (e.g., "No CV versions yet — create one")

---

## 4. PREMIUM/PAID FEATURE GATING

### Current Model: Freemium with AI-powered Premium

**Free Tier Limits** ([constants.ts](apps/api/src/common/constants.ts)):
- CV versions: `1` (free), unlimited (premium)
- Cover letters: `3` (free), unlimited (premium)
- Practice questions: `10` per day (free), unlimited (premium)
- AI features: `5` calls per month (free), unlimited (premium)
- Technical tests: `0` free, premium-only feature
- Templates: First 5 (classic/modern/minimal/executive/creative), all available premium

### Enforcement Mechanisms

#### **1. AI Usage Gating (Monthly Cap)**

[PremiumGuard](apps/api/src/modules/ai/premium.guard.ts):
```typescript
async canActivate(context) {
  const allowed = await this.aiUsage.canUseAi(userId);
  if (!allowed) throw ForbiddenException("Free limit reached, upgrade to Premium");
  return true;
}
```

Applied to:
- `POST /cv/versions/:id/ai-generate-full` 
- `POST /cover-letters/:id/suggest` (also checks within service)
- `POST /cover-letters/:id/rewrite` (also checks within service)
- `POST /cover-letters/:id/ai-generate`
- `POST /sections/:id/ai-generate`

**Tracking:** [AiUsageService.getMonthlyUsageCount()](apps/api/src/modules/ai/ai-usage.service.ts)
- Counts records in `AiUsage` table with `createdAt >= monthStart`
- Records usage only AFTER successful OpenAI response
- Not reset monthly — manual reset needed or calendar-based logic

#### **2. CV Version Limit (Hard Cap)**

[CvService.createVersion()](apps/api/src/modules/cv/cv.service.ts#L35):
```typescript
if (!user?.isPremium) {
  const count = await this.prisma.cvVersion.count({ where: { userId } });
  if (count >= FREE_CV_LIMIT) throw ForbiddenException("Upgrade for unlimited CVs");
}
```

#### **3. Cover Letter Limit (Hard Cap)**

[CoverLettersService.create()](apps/api/src/modules/cover-letters/cover-letters.service.ts#L32):
```typescript
if (!user?.isPremium) {
  const count = await this.prisma.coverLetter.count({ where: { userId } });
  if (count >= FREE_COVER_LETTER_LIMIT) throw ForbiddenException(...);
}
```

#### **4. Practice Questions Daily Limit**

[QuestionsService.getRandomPracticeQuestion()](apps/api/src/modules/questions/questions.service.ts#L109):
```typescript
if (!isPremium) {
  const used = await this.getDailyUsageCount(userId);
  if (used >= FREE_DAILY_QUESTION_LIMIT) throw ForbiddenException(...);
}
```

#### **5. Technical Tests (Premium-only)**

[TechnicalTestsService.createTest()](apps/api/src/modules/technical-tests/technical-tests.service.ts#L41):
```typescript
if (!user?.isPremium) {
  throw ForbiddenException("Technical tests are Premium-only");
}
```

#### **6. Template Restrictions (Free users)**

[CvService.updateVersion()](apps/api/src/modules/cv/cv.service.ts#L92):
```typescript
if (!user?.isPremium && !FREE_TEMPLATE_IDS.includes(data.templateId)) {
  throw ForbiddenException("Free users can only use 5 templates. Upgrade for all.");
}
```

### Billing Integration

[BillingService](apps/api/src/modules/billing/billing.service.ts):

1. **Checkout:** Creates Stripe session, idempotency key scoped to userId (prevents double-checkout)
2. **Webhook Handlers:**
   - `checkout.session.completed` → Set `isPremium=true`, store subscriptionId, priceId, periodEnd
   - `invoice.payment_succeeded` → Renew subscription period
   - `invoice.payment_failed` → Should downgrade? (currently no-op)
   - `customer.subscription.deleted` → Should downgrade? (currently no-op)
3. **Portal:** Creates customer portal link for self-service management

**⚠️ Issues Found:**
- No downgrade logic on failed payment or subscription cancellation
- `isPremium` flag not automatically reset when subscription ends
- Could allow users to retain Premium features after expiry

---

## 5. ALL AI FEATURES

### OpenAI Integration

[openai.provider.ts](apps/api/src/modules/ai/openai.provider.ts):
```typescript
const openai = new OpenAI({ apiKey: config.get("OPENAI_API_KEY") });
```
- Model: `gpt-4o` (hardcoded in all calls)
- No fallback or error handling for rate limits

### AI Features List

| Feature | Where | Triggered By | Free/Premium | Usage Logged | Model |
|---------|-------|--------------|-------------|-------------|-------|
| **CV Section Generation** | [ai.service.ts](apps/api/src/modules/ai/ai.service.ts) | UI: AiSectionAssist | Premium | Yes | gpt-4o |
| **CV Section Rewrite (improve)** | → POST `/sections/:id/ai-generate` | UI button | Premium | Yes | gpt-4o |
| **CV Section Tailor** | → POST `/sections/:id/ai-generate` | Tailor for role | Premium | Yes | gpt-4o |
| **Full CV from Raw Text** | → POST `/versions/:id/ai-generate-full` | Paste brain-dump | Premium | Yes | gpt-4o |
| **Cover Letter Generation** | [ai.service.ts](apps/api/src/modules/ai/ai.service.ts) | POST `/cover-letters/:id/ai-generate` | Premium | Yes | gpt-4o |
| **Cover Letter Rewrite** | → POST `/cover-letters/:id/rewrite` | Improve existing | Premium | Yes | gpt-4o |
| **Cover Letter Tailor** | → POST `/cover-letters/:id/ai-generate` | Tailor for job | Premium | Yes | gpt-4o |
| **Cover Letter Suggestions** | → POST `/cover-letters/:id/suggest` | Smart tips | Free (5/mo limit) | Yes | gpt-4o |
| **Question Generation (Interview)** | [ai-question-generator.service.ts](apps/api/src/modules/ai/ai-question-generator.service.ts) | On-demand + background | Premium | Yes | gpt-4o |
| **Scenario Generation (Tech Tests)** | [ai-scenario-generator.service.ts](apps/api/src/modules/ai/ai-scenario-generator.service.ts) | POST `/technical-tests` | Premium | Yes | gpt-4o |
| **Interview Scoring** | [interview-prep.service.ts](apps/api/src/modules/interview-prep/interview-prep.service.ts) | POST `/sessions/:id/questions/:qId/answer` | Free | No | (rule-based) |

### Detailed Feature Breakdown

#### **1. CV Section Generation** (`POST /cv/sections/:id/ai-generate`)

[AiService.generateCvSectionContent()](apps/api/src/modules/ai/ai.service.ts):

**Prompts:**
- **Generate:** "Create professional CV content for section X. Include skills from notes AND job description, but don't invent."
- **Improve:** "Rewrite section with stronger action verbs and quantification."
- **Tailor:** "Rewrite for role Y, KEEP all user content, add relevant skills from job description."

**Safety:** Anti-hallucination prompt explicitly forbids fabricating skills/metrics

**Usage:** Recorded as "cv-section" action

#### **2. Full CV from Raw Text**

[AiService.generateFullCvFromRawText()](apps/api/src/modules/ai/ai.service.ts):
- Accepts `rawText` (brain-dump), optional `jobTitle`/`jobDescription`
- Returns struct: `{ name, email, phone, location, sections: [...] }`
- Action type: "cv-full"

#### **3. Cover Letter Suite**

[AiService.generateCoverLetterContent()](apps/api/src/modules/ai/ai.service.ts):
- Similar 3 modes: generate, improve, tailor
- Accepts job context: `jobTitle`, `jobDescription`, `companyName`, `companyUrl`
- Tone: "professional" or "friendly"
- Can attach CV sections for context

**Actions:** "cover-letter", "cover-letter-rewrite", "cover-letter-tailor", "cover-letter-suggest"

#### **4. Question Bank Auto-Generation**

[AiQuestionGeneratorService](apps/api/src/modules/ai/ai-question-generator.service.ts):

**Pool Management:**
- For each (track, level, difficulty, tags) combo:
  - Check if pool has >= 5 questions
  - If < 5, generate 8 new questions
  - Log generation in `QuestionGenerationLog`

**Cooldowns & Caps:**
- 24-hour cooldown per filter hash (prevents bill-spiking)
- 5-minute urgent cooldown for urgent refills
- Max 2 user-triggered generations per day per user (prevents abuse)
- Background fill: up to 30 questions in a batch (budget)

**Generation Flow:**
1. `POST /interview-prep/sessions` (user creates session)
2. → `ensurePoolForFilters()` called for session filters
3. → If pool size < 5, call OpenAI to generate questions
4. → Store as `InterviewQuestion` with `source: "ai-generated"`

**Logging:**
- `QuestionGenerationLog`: filterHash, combo, count, userId, timestamp
- Enables abuse detection & cost tracking

#### **5. Technical Test Scenario Generation**

[AiScenarioGeneratorService](apps/api/src/modules/ai/ai-scenario-generator.service.ts):

**Flow:**
1. Try hardcoded template engine first (deterministic)
2. If no tag match OR 25% chance: use AI
3. Generate scenario with: `brief`, `requirements`, `criteria`, `estimatedTime`, `tags`

**Action:** "scenario-generation"

#### **6. Interview Session Scoring (Rule-based, not AI)**

[RuleBasedEvaluator](apps/api/src/modules/interview-prep/engine):
- Matches user answer against rubric (expected points, red flags)
- Scores out of 10 per question
- Returns feedback (points hit, missed, red flags, suggestions)
- **No AI call here — local evaluation**

### AI Feature Frontend Integration

[AiSectionAssist.tsx](apps/web/src/features/cv-builder/components/AiSectionAssist.tsx):
```typescript
const [action, setAction] = useState<AiAction>("generate" | "improve" | "tailor");
const [result, setResult] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

const handleGenerate = async (selectedAction) => {
  const res = await aiGenerate.mutateAsync({ sectionId, action, ... });
  setResult(res.data.content);
};
```

Pattern: UI shows loading spinner, error message, result preview with apply/discard buttons

### Usage Tracking

[AiUsageService.recordUsage()](apps/api/src/modules/ai/ai-usage.service.ts):
```typescript
await this.prisma.aiUsage.create({
  data: { userId, action: "cv-section" | "cover-letter" | ... }
});
```

**Issue:** Action logged AFTER successful OpenAI response, but what if DB insert fails? Monthly count would be wrong.

---

## 6. CURRENT MONETIZATION ANALYSIS

### Free vs Premium Breakdown

**TRULY FREE (no premium version):**
- ✅ Job Tracker (Kanban board)
- ✅ Basic Practice Questions (10/day limit)
- ✅ Interview Prep (mock interviews with rule-based scoring)
- ✅ Question Suggestions (cover letter only, 5/month limit)

**PREMIUM-GATED:**
- ❌ CV Builder: Can create 1 version; Premium = unlimited + AI rewriting + all templates
- ❌ Cover Letters: Can create 3 letters; Premium = unlimited + AI generation + better context
- ❌ Technical Tests: Premium-only ($$$)
- ❌ AI Features: 5 calls/month free, unlimited premium

**MONETIZATION ISSUES FOUND:**

1. **⚠️ No downgrade enforcement:**
   - User paid for Premium on day 1
   - Subscription auto-renewed on day 30
   - On day 60, subscription auto-cancelled but `isPremium` still true
   - User retains Premium features (CV AI, unlimited practice, etc.)
   - Result: **Lost revenue**

2. **⚠️ No payment failure handling:**
   - `invoice.payment_failed` webhook exists but does nothing
   - User thinks subscription is active, can still use Premium features
   - Result: **Debt/chargeback risk**

3. **⚠️ Subscription expiry not enforced:**
   - `stripeCurrentPeriodEnd` stored but never checked
   - Premium gating only checks `isPremium` boolean
   - Feature: Check `Date.now() > stripeCurrentPeriodEnd`? Not done.

4. **⚠️ AI usage limit bypassed on frontend:**
   - `isPremium` checked on frontend in UI (show AI buttons or not)
   - But `useAiUsage()` hook fetches monthly count
   - If frontend cache stale, user might click "Generate" button
   - Backend PremiumGuard catches it, but UX is poor

5. **✅ Good:** Unique emails prevent duplicate accounts
6. **✅ Good:** Stripe idempotency key prevents double checkout

---

## 7. CODE QUALITY ISSUES

### 1. Loose Typing (Multiple `any` casts)

**Found:**
- [questions.service.ts:181](apps/api/src/modules/questions/questions.service.ts#L181): `where as any` (4 instances)
- [interview-prep.service.ts:155](apps/api/src/modules/interview-prep/interview-prep.service.ts#L155): `where as any`
- [technical-tests.service.ts:88](apps/api/src/modules/technical-tests/technical-tests.service.ts#L88): `scenario as any`
- [cv.service.ts:113](apps/api/src/modules/cv/cv.service.ts#L113): `themeConfig as any`
- [ai-question-generator.service.ts:216](apps/api/src/modules/ai/ai-question-generator.service.ts#L216): `filters as any`

**Impact:** Silent data structure errors, could cause unexpected behavior

**Fix:** Define proper TypeScript types for Prisma where clauses or use type-safe builders

### 2. Console.log in Production

**Found:**
- [cv.service.ts:86, 118](apps/api/src/modules/cv/cv.service.ts#L86)
- [pdf.service.ts:134, 135, 147](apps/api/src/modules/pdf/pdf.service.ts#L134)

**Risk:** Sensitive data logged (contact info, layout config)

**Fix:** Use Logger (already injected) or remove debug logs

### 3. Error Handling Gaps

**Issues:**
- [BillingService.onInvoiceFailed()](apps/api/src/modules/billing/billing.service.ts): No-op (should set `isPremium=false`)
- [BillingService.onSubscriptionDeleted()](apps/api/src/modules/billing/billing.service.ts): No-op (should set `isPremium=false`)
- OpenAI API errors: No retry logic, no rate limit awareness

**Risk:** Inconsistent premium state after subscription events

### 4. No Tests Found

**Result:** No .spec.ts or .test.ts files detected

**Risk:**
- Premium gating logic untested (could leak features)
- AI prompt changes untested (could cause hallucinations)
- Webhook handlers untested (could crash on unexpected Stripe events)

### 5. Commented-Out Code & TODOs

**Not found extensively** (good), but:
- [cv.service.ts](apps/api/src/modules/cv/cv.service.ts): Some state management logic could be cleaner

### 6. Hardcoded Values

**Found:**
- `gpt-4o` hardcoded in all AI service calls (no fallback, no config)
- Stripe API version hardcoded: `apiVersion: "2026-01-28.clover"`
- Interview persona names hardcoded in map (alex, riley, morgan, etc.)
- AI generation budget constants (threshold=5, batch=8, cooldown=24h)

**Fix:** Move to config or constants.ts

### 7. Inconsistent Error Messages

**Example:**
- Some errors: "You've reached your free monthly limit..."
- Others: "Free accounts are limited to..."
- Others: "Upgrade to Premium for..."

**Impact:** Inconsistent UX

---

## 8. TYPES & VALIDATION

### Strengths

✅ **Type Safety:**
- Shared `@careerportal/shared/types` package with 39 exported interfaces
- All API responses wrapped in `ApiResponse<T>`
- DTOs with class-validator decorators

✅ **Validation:**
- Global ValidationPipe with `whitelist: true, forbidNonWhitelisted: true`
- URL validation: `@IsUrl({ protocols: ["https"] })` for photoUrl
- Field length limits: `@MaxLength(200)` for name, email, etc.

### Gaps

❌ **Missing Validation:**
- CV section content: No max length validation (could store 100MB string)
- Cover letter body: No max length validation
- Job description (when passed to AI): No max length validation
- Tags on technical tests: No validation (could be SQL injection-like)

❌ **Loose Types:**
- `AiQuestionGeneratorService.countTagOverlap(scenario: any)` — should type scenario
- `ThemeConfig` stored as JSON, no schema validation on read

❌ **Client-side Only:**
- React Hook Form validates form inputs, but no server-side re-validation
- Example: File upload (not used currently), but if added, could bypass client validation

---

## 9. UI/UX PATTERNS

### Consistent Patterns

✅ **Color/Theme:**
- Tailwind CSS with custom design tokens (primary-600, text-primary, bg-elevated, etc.)
- Dark mode variables (e.g., `dark:border-emerald-800/60`)

✅ **Icons:**
- lucide-react for all icons (Sparkles, Wand2, Crown, Zap, Loader2, etc.)
- Consistent sizing (h-3.5 w-3.5 for small, h-5 w-5 for medium)

✅ **Button States:**
- Active: `active:scale-95` (press feedback)
- Disabled: opacity handled by @disabled attributes
- Loading: Show Loader2 icon

### Inconsistent Patterns

❌ **Loading States:**
- BillingPage: Shows full `<Spinner />` before loading status
- CvBuilder: Some components don't show loading spinner
- AiSectionAssist: Shows `Loader2` icon inline (good)
- RawTextCvPanel: Comment says `{/* Loading state */}` but minimal UX

❌ **Error States:**
- AiSectionAssist: Shows error string in red text
- Some endpoints: Return 409 Conflict, others 403 Forbidden for premium checks
- UX: Users see technical error messages ("You've reached your monthly limit...") instead of actions

❌ **Empty States:**
- CV versions: Shows "No CV versions yet" with create button (good)
- Practice questions: Unclear if "no questions match filters" vs "pool exhausted"
- Interview sessions: Unclear state transitions

❌ **Form Feedback:**
- CV section editor: No unsaved changes indicator
- Job tracker: No success toast after adding job
- Cover letters: "Suggestions" feature returns array of strings with no context

### Missing Components

- Toast notifications (user feedback on mutations)
- Confirmation dialogs (delete CV warning)
- Skeleton loaders (placeholder UI while loading)
- Accessibility: No aria-labels on custom buttons, limited keyboard navigation

---

## 10. SECURITY CHECKLIST

### Authentication & Tokens

✅ **Good:**
- Supabase handles OAuth/email/password (offloaded from this codebase)
- JWT verification via `jwksRsa` (Supabase JWKS endpoint)
- Support for both HS256 (legacy) and ES256 (JWKS) algorithms
- Token verified on every request via AuthGuard

❌ **Concerns:**
- Token stored in browser's sessionStorage (Supabase default)
- No CSRF protection (relies on SameSite=Strict cookies)
- No rate limiting on `/auth/me` (but Throttle middleware defaults to 3/s)

### Authorization

✅ **Good:**
- All endpoints (except public landing page) require AuthGuard
- PremiumGuard checks `isPremium` flag for premium features
- Webhook endpoint verified via Stripe signature (HMAC)

❌ **Concerns:**
- `ADMIN_API_KEY` exists in env for `/admin/background-fill` but no validation in code (check needed)
- No role-based access control (RBAC) — only binary premium check
- No audit logging of sensitive actions (subscription purchase, data export)

### Data Protection

✅ **Good:**
- CORS configured with allowlist (only specific origins)
- Helmet.js for security headers
- Input validation with `forbidNonWhitelisted: true`

❌ **Concerns:**
- No encryption at rest (PostgreSQL default)
- User data (CVs, cover letters) stored as plain text
- AI prompts + responses not logged (good for privacy, bad for debugging)
- PDF generation via Playwright with raw HTML (XSS risk if user content not sanitized in template)

### API Exposure

✅ **Good:**
- Swagger docs disabled in production
- `GET /questions/practice/check` is unauthenticated (stateless), but why?
  - Allows checking answers without logging in
  - Could be feature (share quiz links) or oversight

❌ **Concerns:**
- `GET /questions` returns full question bank unauthenticated
  - Could be scraped for data
  - Daily limit only enforced on `POST /practice/next`, not on read

### Secret Management

✅ **Good:**
- .env.example provided (no real secrets)
- Railway/Docker configs don't embed secrets
- Environment variables validated via Zod schema

❌ **Concerns:**
- OpenAI API key never logged (good), but also no rate limiting locally
- Stripe webhook secret never logged (good)
- No secret rotation mechanism (would need manual env update + redeploy)

### XSS / Injection Risks

✅ **Good:**
- React escapes JSX by default (XSS protected)
- Prisma parameterized queries (SQL injection protected)
- Input validation on DTOs

❌ **Concerns:**
- CV section content rendered as HTML in preview (render-cv-html.ts)
  - Could allow user to inject `<script>` tags
  - Should use `dangerouslySetInnerHTML` with DOMPurify or similar
- AI-generated text not sanitized before rendering
  - OpenAI outputs could include HTML
- PDF rendering via Playwright + template: If template interpolates user data wrong-like, could be RCE

---

## 11. DATABASE SCHEMA ANALYSIS

### Overall Structure

**Tables:** 18 main entities, well-normalized

```
User (center)
  ├→ CvVersion & CvSection (1:many)
  ├→ CoverLetter (1:many)
  ├→ Job (1:many)
  ├→ InterviewSession & InterviewSessionQuestion (1:many)
  ├→ TechnicalTest (1:many)
  ├→ QuestionAnswer (1:many)
  └→ AiUsage (1:many)

Question & QuestionOption (1:many, for multiple choice)
InterviewQuestion & InterviewSessionQuestion (1:many, reusable bank)
```

### Schema Issues & Observations

1. **Unused Fields:**
   - `User.supabaseId` — Could be indexed uniquely (already is)
   - `CvVersion.themeConfig` — Stored as JSON, never queried (fine for schema flexibility)
   
2. **Denormalization Opportunities:**
   - `InterviewSession.totalScore` — Computed from session questions, stored for query perf (good)
   - `AiUsage.id` — Could be removed if userId+createdAt is compound key (but id allows easy deletion)

3. **Missing Constraints:**
   - `CvSection.order` — No unique constraint on (cvVersionId, order)
     - Could allow duplicate order values, breaking reorder logic
   - `QuestionAnswer.selectedOptionId` — Foreign key nullable, but no check that option matches question

4. **Implicit Cascading:**
   - `CvSection` cascades delete on `CvVersion` delete (good)
   - `InterviewSessionQuestion` cascades delete on `InterviewSession` (good)
   - But: Deleting a `Question` cascades delete `QuestionOption` — could orphan `QuestionAnswer` records

5. **Audit Trail:**
   - `createdAt` / `updatedAt` timestamps on most entities (good)
   - No soft deletes (good for simplicity, bad for data recovery)

6. **Indexing:**
   - `AiUsage`: Index on (userId, createdAt) for monthly aggregation (good)
   - `QuestionGenerationLog`: Index on (filterHash, createdAt) (good)
   - Missing: Index on `InterviewQuestion.source` (to find AI-generated questions)

### Type Mapping Issues

```prisma
model CvSection {
  sectionType String @default("custom")  // Could be enum
  // Should be: sectionType SectionType @default(CUSTOM)
}

enum SectionType {
  PROFILE
  EXPERIENCE
  EDUCATION
  SKILLS
  PROJECTS
  CUSTOM
}
```

- Current: String allows invalid values ("invalid_section_type")
- Impact: Frontend filtering breaks if DB has invalid type

---

## 12. CONFIG & SECRETS MANAGEMENT

### Environment Variables

Located in [apps/api/src/common/env.config.ts](apps/api/src/common/env.config.ts):

**Required:**
- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY` — OpenAI API access
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_live_*)
- `STRIPE_PRICE_ID` — Stripe product price ID
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing key

**Optional (with defaults):**
- `SUPABASE_URL` — Supabase project URL (optional for auth)
- `SUPABASE_JWT_SECRET` — Local JWT secret (optional for HS256)
- `CLIENT_URL` — Frontend base URL (default: http://localhost:4200)
- `PORT` — API port (default: 3000)
- `NODE_ENV` — development | production | test
- `ADMIN_API_KEY` — Admin token for background fill (optional)

### Validation

✅ **Good:**
- Zod schema validation on startup
- Helpful error messages if validation fails
- Type inference from schema: `export type EnvConfig = z.infer<typeof envSchema>`

❌ **Concerns:**
- No environment loading before schema validation (would crash if .env missing)
- `ADMIN_API_KEY` optional but used in endpoint — should either require it or make endpoint scheduled task

### Secrets Exposure Risk

✅ **Good:**
- Only .env.example committed (no real secrets in repo)
- .env in .gitignore (likely)
- Docker secrets not hardcoded (Railway passes via env)

❌ **Concerns:**
- Node process env vars visible to any spawned child process
- Playwright subprocess could expose OPENAI_API_KEY in error logs

---

## 13. EXISTING TESTS

**Status:** ❌ **NO TESTS FOUND**

Search for `*.test.ts`, `*.spec.ts` returned no results.

**Impact:**
- Premium gating logic untested (could leak)
- AI prompt changes untested (could hallucinate)
- Webhook handlers untested (Stripe API changes could break)
- AuthGuard untested (JWT validation not verified)
- PrismaService untested (DB migrations not validated)

**Recommendation:** Add at minimum:
1. Unit tests for premium checks (PremiumGuard, AI usage counting)
2. Integration tests for webhook handlers
3. E2E tests for checkout flow

---

## 14. DEAD OR INCOMPLETE CODE

### Unused Exports

- None found extensively, but some services export interfaces that aren't used elsewhere

### Incomplete Features

1. **PDF Generation** (`apps/api/src/pdf/`)
   - `pdf.service.ts` exports HTML rendering
   - Frontend has PdfModule and PdfController for `/cv/pdf/:versionId`
   - **Status:** Likely incomplete (no download button in CV builder UI)

2. **Qualifications Feature** (`apps/web/src/pages/QualificationsPage.tsx`)
   - Route exists in App.tsx but no module in API
   - **Status:** Frontend-only, likely not implemented

3. **Interview Interviewer Personas**
   - 8 interviewer configs defined (alex, riley, morgan, etc.)
   - **Status:** Options available in UI, logic in InterviewPrepService

4. **Background Task for Question Generation**
   - `POST /admin/background-fill` endpoint
   - Meant to pre-generate questions for all (track, level, difficulty) combos
   - **Status:** Exists but no cron job / scheduler (would need external trigger)

### Commented Out Code

- None found extensively (good)
- Some TODOs or FIXME comments not found (good)

---

## 15. SUMMARY OF KEY FINDINGS

### Strengths

✅ **Well-structured monorepo** with clear separation of concerns (API, frontend, shared libs)  
✅ **Comprehensive premium gating** with multiple enforcement layers  
✅ **AI feature parity** across CV, cover letters, interview prep, and technical tests  
✅ **Proper auth flow** via Supabase + local user sync  
✅ **Type-safe data access** with React Query + Zod  
✅ **Responsive UI** with consistent Tailwind styling  

### Critical Issues

🔴 **No subscription downgrade enforcement** — Users retain Premium after payment fails/cancels  
🔴 **No period-end validation** — Premium features not disabled when subscription expires  
🔴 **No tests** — Premium logic and webhooks untested  
🔴 **Hardcoded AI model** — No fallback if gpt-4o becomes unavailable  
🔴 **Loose typing (`any` casts)** — Prisma queries not type-safe  

### Medium Issues

🟡 **Missing error handling** for failed payments and subscription deletion  
🟡 **Inconsistent loading/error states** in UI (some components show spinners, others don't)  
🟡 **No XSS sanitization** in PDF rendering or AI-generated content rendering  
🟡 **Weak validation** on large text fields (CV sections, cover letters)  
🟡 **No rate limiting on data reads** (GET /questions could be scraped)  
🟡 **No audit logging** for sensitive actions  

### Nice-to-Have Improvements

🟢 **Toast notifications** for user feedback  
🟢 **Skeleton loaders** while data loads  
🟢 **Confirmation dialogs** for destructive actions  
🟢 **Accessibility** (aria-labels, keyboard navigation)  
🟢 **E2E tests** using Playwright or Cypress  

---

## Recommendations (Priority Order)

### 🚨 P0 (Fix immediately)

1. Add subscription expiry check: When checking `isPremium`, also verify `stripeCurrentPeriodEnd > now()`
2. Add webhook handlers for failed payments: Set `isPremium=false` on `invoice.payment_failed` and `subscription.deleted`
3. Add E2E test for premium enforcement (upgrade → use feature → test gate)
4. Remove `console.log` statements in production code

### 🔥 P1 (Fix this sprint)

5. Replace `any` type casts with proper TypeScript interfaces
6. Add rate limiting to `GET /questions` endpoint
7. Sanitize HTML before rendering (use DOMPurify on CV preview)
8. Add conflict prevention: Unique constraint on (cvVersionId, order) in CvSection
9. Add unit tests for AiUsageService.canUseAi() and premium checks

### 📌 P2 (Fix next quarter)

10. Implement cron job for background question generation (or integrate with Bull/Agenda)
11. Add toast notifications for mutation success/error
12. Improve error messages (consolidate into constant enum)
13. Implement soft deletes for audit trail
14. Add OpenAI rate limit retry logic + fallback model

### 💡 P3 (Nice-to-have)

15. Add skeleton loaders for async data
16. Implement accessibility improvements
17. Add comprehensive E2E test suite
18. Improve loading state consistency across components

---

**Audit completed:** April 4, 2026  
**Auditor notes:** This is a solid proof-of-concept portfolio builder with reasonable premium gating, but needs subscription enforcement fixes before handling real payment volume. The lack of tests is the biggest risk factor for premium feature leakage.
