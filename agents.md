# agents.md — AI Agent Guidelines for JotaComplaint V2

> This file documents how AI coding agents (Gemini, Codex, Claude, etc.) should
> interact with this codebase. Read this before making any changes.

---

## 1. Project Identity

**JotaComplaint V2** is a production-grade municipal complaint management system.
Stack: Next.js 16 (App Router + Turbopack), TypeScript, Prisma 6, Neon PostgreSQL,
Upstash Redis, BullMQ, Pusher, Resend, shadcn/ui, Tailwind 4, Vitest, Playwright.


---

## 2. Non-Negotiable Rules

### Never Do This
- ❌ Do NOT use `as any` — derive types from Prisma using `Prisma.XGetPayload<{...}>`
- ❌ Do NOT put business logic in route handlers — controllers are thin (auth + validation + delegation only)
- ❌ Do NOT call `prisma` directly from a page or action — always go through a service function
- ❌ Do NOT add `"use server"` to a page file that also exports `metadata` — they are mutually exclusive
- ❌ Do NOT use `analytics: true` on Ratelimit instances — it fires extra Redis writes; keep `analytics: false`
- ❌ Do NOT commit `.env` — use `.env.example` and GitHub Actions secrets
- ❌ Do NOT skip the `ephemeralCache` + `timeout` pattern on Ratelimit — rate limiters must fail-open

### Always Do This
- ✅ Keep route handlers thin: auth check → Zod parse → service call → map errors
- ✅ Use `Promise.allSettled` (not `Promise.all`) when fetching multiple DB sources in RSC pages
- ✅ Mock `~/lib/cache`, `~/lib/pusher`, `~/server/jobs/queues`, `~/server/services/notification.service` in all unit tests via `src/test/setup.ts`
- ✅ Use `vi.hoisted()` for mocks that reference variables defined before `vi.mock()`
- ✅ Add `data-testid` attributes to any interactive element an E2E test needs to select
- ✅ Use `test.setTimeout(90000)` for multi-step E2E flows (3-role lifecycle needs >30s)
- ✅ Use `browser.newContext()` + `context.close()` for role-switching in Playwright — not `clearCookies()`

---

## 3. Architecture — Where Things Live

```
Controller (route.ts / actions.ts)
    │  auth check, rate limit, Zod parse, error mapping
    ▼
Service (server/services/*.service.ts)
    │  RBAC, business logic, DB transaction, postUpdateSideEffects()
    ▼
Prisma DB (server/db.ts singleton)

Side Effects (non-blocking, inside postUpdateSideEffects):
    ├── emailQueue.add(...)          ← BullMQ
    ├── triggerComplaintUpdate(...)  ← Pusher
    ├── triggerDashboardRefresh()    ← Pusher
    └── invalidateCache(...)         ← Upstash
```

### Key Service Functions
| Function | File | Notes |
|---|---|---|
| `updateComplaint()` | `complaint.service.ts` | RBAC + DB tx + postUpdateSideEffects |
| `getComplaintById()` | `complaint.service.ts` | RBAC enforced inside service |
| `getPublicStats()` | `analytics.service.ts` | Cached 10min via getCached |
| `getDashboardStats()` | `analytics.service.ts` | Cached 5min |
| `findSimilarComplaints()` | `duplicate.service.ts` | pg_trgm + Haversine — requires extension on DB |

---

## 4. Type System

Never define complaint shapes by hand. Always derive from Prisma:

```ts
// In src/types/complaint.ts
export const complaintListInclude = { user: true, department: true, assignedTo: true, _count: true } as const;
export const complaintDetailInclude = { ...complaintListInclude, comments: true, activities: true } as const;

export type ComplaintWithRelations = Prisma.ComplaintGetPayload<{ include: typeof complaintListInclude }>;
export type ComplaintDetailsWithRelations = Prisma.ComplaintGetPayload<{ include: typeof complaintDetailInclude }>;
```

Import `ComplaintWithRelations` from `~/types/complaint` everywhere. Never use `any`.

---

## 5. Testing

### Unit Tests (Vitest)
- Files co-located: `*.service.test.ts` next to `*.service.ts`
- Global mocks loaded from `src/test/setup.ts` — check here before mocking anything locally
- Pattern: `vi.hoisted()` → `vi.mock()` → `describe()` → `beforeEach(vi.clearAllMocks)`
- Current coverage: 7 tests across complaint, analytics, duplicate services

```bash
npm run test -- --run     # run once (CI mode)
npm run test              # watch mode
```

### E2E Tests (Playwright)
- Config: `playwright.config.ts` — Chromium only, 90s timeout for lifecycle tests
- Credentials: import from `e2e/fixtures/users.ts` — never hardcode emails in specs
- Role switching: `browser.newContext()` per role, `context.close()` after
- Stable selectors: always use `data-testid` attributes, never CSS classes

```bash
npm run test:e2e          # requires running dev server or starts its own
```

### CI Pipeline (GitHub Actions)
- File: `.github/workflows/ci.yml`
- Services: `postgres:15` + `redis:7`
- Upstash in CI: fake HTTPS URL — cache calls fail-open (try/catch everywhere)
- Steps: `install → generate → db push → lint → typecheck → vitest → seed → playwright`

---

## 6. Infrastructure Gotchas

### Upstash Redis
- SDK is **HTTP-only** — never set `UPSTASH_REDIS_REST_URL=redis://...` — must be `https://`
- In CI, use a fake `https://fake.upstash.io` URL — the SDK initialises but all calls fail gracefully
- Rate limiters MUST have `ephemeralCache` + `timeout: 2000` or they'll throw on network failure

### pg_trgm Extension
- **Status:** Enabled manually on Neon production DB — NOT in migration SQL
- The `similarity()` function in `duplicate.service.ts` requires this extension to exist
- In CI (plain Postgres), the `/api/complaints/similar` route returns `{ similar: [] }` silently (catch block)
- To enable on a new DB: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- **TODO:** Add a dedicated migration SQL file to make this declarative

### BullMQ / Redis
- BullMQ requires TCP Redis (`ioredis`) — Upstash HTTP cannot be used for BullMQ
- Worker runs as a separate process: `npm run worker`
- In CI the worker is not started — email/escalation jobs are queued but not processed (acceptable)

### Pusher
- Server: `lib/pusher.ts` — triggers events from API routes/actions
- Client: `lib/pusher-client.ts` — browser singleton via `pusher-js`
- In CI: fake key/cluster values — Pusher connections fail silently, no real-time in E2E

### Next.js `"use server"` Rule
- `"use server"` on a file means **every export must be an async function**
- Never add `export const metadata` to a `"use server"` file — it will fail at build
- Page files (`page.tsx`) should NOT have `"use server"` — they are RSC by default

---

## 7. Seed Data

```bash
npm run seed     # wipes and re-creates all data
```

Credentials always created by seed:
| Role | Email | Password |
|---|---|---|
| Admin | `admin@municipality.gov` | `12345678` |
| User | `rajesh.kumar@gmail.com` | `12345678` |
| Staff | `water.officer@municipality.gov` | `12345678` |
| Staff | `roads.officer@municipality.gov` | `12345678` |

The seed is idempotent (clears before inserting). Safe to run multiple times.

---

## 8. Environment Variables

All required vars are in `.env.example`. For CI see `.github/workflows/ci.yml`.

Critical ones agents commonly miss:
| Var | Notes |
|---|---|
| `AUTH_URL` | Required by Auth.js v5 in production/CI — set to `http://localhost:3000` in CI |
| `AUTH_TRUST_HOST` | Must be `true` in CI/Docker for Auth.js to accept non-HTTPS callbacks |
| `UPSTASH_REDIS_REST_URL` | Must start with `https://` — never `redis://` |
| `NEXT_PUBLIC_PUSHER_KEY` | Separate from `PUSHER_KEY` — client-side bundle needs the `NEXT_PUBLIC_` prefix |
| `SKIP_ENV_VALIDATION` | Set to `1` in CI to bypass T3 env validation for stub values |

---

## 9. What's Left (Phase E)

| Task | Priority | Notes |
|---|---|---|
| `docker-compose.yml` | High | App + Postgres + Redis + Worker in one command |
| Audit Log Viewer | Medium | Admin page for `ComplaintActivity` table |
| Satisfaction Ratings | Medium | Post-resolution feedback, needs schema field |
| pg_trgm migration | Low | Make extension declarative — add `CREATE EXTENSION` to a migration file |

After Phase E: merge `feat/cicd-hardening` → `main`, tag `v2.0.0`.

---

## 10. Commit Convention

```
type(scope): short description

feat(complaints): add SLA countdown to complaint card
fix(ci): make rate limiters resilient to Upstash outages
refactor(lint): remove unused imports
test(e2e): stabilize lifecycle flow with isolated browser contexts
chore(ci): fix config exports for ESLint
```

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`
