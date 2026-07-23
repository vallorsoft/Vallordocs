# Modules (Modular Monolith)

Each subdirectory is a **self-contained business module** (PRD 1. fejezet –
Modular Monolith). The whole system runs as a single Next.js application, but
the code is split into modules that must not reach into each other's internal
implementation.

## Rules

- A module exposes its public API through its own `index.ts` barrel. Other
  modules import **only** from that barrel, never from internal files.
- Cross-cutting primitives (errors, types, utilities) live in `src/shared`,
  `src/lib`, and `src/config`.
- Data access goes through `src/repositories`; business logic through
  `src/services`. Modules orchestrate these; they do not embed raw Prisma
  queries in UI code.
- Every tenant-scoped query filters by `tenantId`. Tenant isolation is the
  primary, non-negotiable security requirement.

## Module map

| Module          | Milestone | Status         | Responsibility                                                                               |
| --------------- | --------- | -------------- | -------------------------------------------------------------------------------------------- |
| `auth`          | M2        | ✅ Implemented | Password hashing (Argon2id), JWT access+refresh tokens, RBAC (7 roles, 13 permission keys)   |
| `tenants`       | M2        | ✅ Implemented | `TenantContext`, `tenantScope()`, `assertSameTenant()` for tenant isolation and IDOR defence |
| `storage`       | M3        | ✅ Implemented | `StorageProvider` interface, safe key paths, Fly Volume impl, R2/S3/Azure/GCS stubs          |
| `ai`            | M3        | ✅ Implemented | `AiProvider` interface, 11-step restoration pipeline, authenticity guardrails, Gemini impl   |
| `documents`     | M3        | ✅ Implemented | Magic-number detection, file security validation, photo quality checks, A4 PDF generation    |
| `users`         | M4        | ✅ Implemented | User/profile validation, self-service profile, device/session management                     |
| `drivers`       | M4        | ✅ Implemented | Driver entity validation, driver-code normalisation                                          |
| `trips`         | M4        | ✅ Implemented | Trip validation, status state machine (allowed transitions)                                  |
| `offline`       | M4        | ✅ Implemented | Offline-first sync queue: dedupe, deterministic backoff, dead-letter (PWA background sync)   |
| `audit`         | M5        | ✅ Implemented | Append-only audit entry builder, secret redaction, shallow diff, immutability guard          |
| `notifications` | M5        | ✅ Implemented | AI-lifecycle → notification mapping, unread/read helpers (push-ready)                        |
| `settings`      | M5        | ✅ Implemented | Zod-validated tenant settings with safe defaults, key/value row mapping, retention policy    |
| `dashboard`     | M5        | ✅ Implemented | Pure statistics aggregation (uploads, AI success rate, avg time, top drivers, storage)       |
| `security`      | M5        | ✅ Implemented | Per-action rate limiter (brute-force), UA parser, GDPR export/anonymise/retention            |
| `monitoring`    | M5        | ✅ Implemented | Composable health-check aggregation with per-probe timeout and safe (non-leaking) details    |

## M2 — Auth & Multi-Tenant

- **`auth/password.ts`** — Argon2id (OWASP params: 19 MiB, 2 iterations), strength policy (12+ chars, lower/upper/digit/special)
- **`auth/tokens.ts`** — HS256 JWTs; access token 15 min / refresh token 30 days; audience-separated; refresh token stored as SHA-256 hash only
- **`auth/rbac.ts`** — `ROLE_PERMISSIONS` map for all 7 roles; `requirePermission` / `can` / `canAll` / `canAny` helpers
- **`tenants/tenant-context.ts`** — `tenantScope()` adds `{tenantId, deletedAt:null}` to every query; `assertSameTenant()` prevents IDOR; platform_owner bypasses tenant filter

## M3 — AI, Storage, Documents

- **`storage/`** — Key format `{tenantId}/documents/{tripId}/{documentId}/{variant}/{uuid}.{ext}`; path traversal prevention in Fly Volume; cached singleton via `getStorageProvider()`
- **`ai/pipeline.ts`** — 11 ordered steps: `perspective_correction → edge_detection → auto_crop → shadow_removal → background_removal → geometry_correction → contrast_optimization → white_balance → denoise → sharpen → a4_fit`
- **`ai/guardrails.ts`** — System prompt forbids 8 content-altering modifications (inventing text, correcting numbers, changing dates, …); allows only 11 visual adjustments
- **`ai/gemini-provider.ts`** — Injected `GeminiTransport` for full unit-testability; `gemini-2.0-flash` default model
- **`documents/magic-numbers.ts`** — Detects JPEG / PNG / PDF / HEIC / WEBP from actual bytes, never from extension or declared MIME
- **`documents/file-security.ts`** — 9 issue types including double-extension spoofing, MIME mismatch, extension–content mismatch
- **`documents/quality.ts`** — Numeric thresholds (1000 px min, sharpness ≥ 0.35, brightness 0.2–0.9); merges device-detected flags, de-duplicates
- **`documents/pdf.ts`** — Multi-page A4 PDF via `pdf-lib`; 300 DPI target; aspect-ratio preserving with centred placement

## M4 — Driver PWA, Domain Entities, Offline & i18n (PRD 4. fejezet)

- **`users/user-validation.ts`** — Zod `userProfileSchema` (name, email, phone, language, timezone, status, roles) + `selfProfileSchema`; every message is a translation key, never a raw string
- **`users/devices.ts`** — Active-session listing, sort by last-used, "log out every other device" selection; the current session can never be revoked individually
- **`drivers/driver-validation.ts`** — Driver schema; `normalizeDriverCode` (trim + uppercase + strip internal whitespace) applied before the `^[A-Z0-9-]{2,32}$` check
- **`trips/trip-validation.ts` + `trip-status.ts`** — Trip schema with `arrivalAt ≥ departureAt` cross-field rule; status state machine `planned → in_progress → completed` (with `cancelled`); terminal states reject further transitions
- **`offline/sync-queue.ts`** — Deterministic, immutable offline queue for the Driver PWA: id-dedupe, FIFO due-item selection, exponential backoff (`base·2^attempts`, capped), and dead-lettering after `maxAttempts` (PRD 3. fejezet – Dead Letter Queue)
- **`lib/datetime.ts`** — Locale (`hu`/`ro`) + timezone (`Europe/Budapest`/`Europe/Bucharest`) aware formatting via `Intl`; `relativeTime` for feeds
- **PWA** — `public/manifest.webmanifest`, maskable `public/icons/icon.svg`, `public/sw.js` (versioned cache, cache-first static / network-first navigation with offline fallback, `sync` tag `vallordocs-sync`, `SKIP_WAITING` update flow), and the `RegisterServiceWorker` client component wired into the locale layout (production only)
- **i18n** — `validation.*`, `notifications.*`, `tripStatus.*`, `driverStatus.*`, `userStatus.*`, `offline.*`, `pwa.*` keys added to `hu.json` and `ro.json`

## M5 — Security, GDPR, Audit & Monitoring (PRD 5. fejezet)

- **`audit/audit.ts`** — `AUDIT_ACTIONS` catalogue; `buildAuditEntry` returns a frozen, fully-populated record; `redactSensitive` strips secrets (password/token/apiKey/…) before they reach `oldValue`/`newValue`; `diffValues` stores only the delta; `assertAuditImmutable` guards against in-place edits
- **`notifications/notifications.ts`** — `notificationForAiStatus` maps each AI job state to `{ type, titleKey, messageKey }` (done→success, failed→error, retrying/cancelled→warning); pure unread/read helpers
- **`settings/settings.ts`** — Zod tenant settings (AI enabled, PDF quality, storage limit, document/audit/log retention days) with safe defaults; `toSettingRows`/`fromSettingRows` map to the key/value `Setting` model, ignoring unknown keys
- **`dashboard/stats.ts`** — Pure aggregation: uploads in range, AI success rate (÷0-guarded), average processing time, top-N drivers (deterministic tie-break), storage usage, `buildDashboard` summary
- **`security/rate-limit.ts`** — Fixed-window, injectable-store/clock limiter with per-action policies (login/upload/ai/api); `assert` throws `RateLimitedError`, `consume` never throws (brute-force protection)
- **`security/user-agent.ts`** — Dependency-free UA parser → `{ browser, os, device }` for audit and login history
- **`security/gdpr.ts`** — `anonymizeUser` (idempotent Right-to-be-Forgotten), `buildDataExport` (portability), `retentionCutoff`/`expiredRecords` (retention policy)
- **`monitoring/health.ts`** — `runHealthChecks` orchestrates injected probes (database/redis/storage/gemini/queue/disk/memory) in parallel with a per-probe timeout, folds an overall `ok`/`degraded`/`down` status, and collapses failures to a safe detail so no internal error text leaks; wired into `/api/health` (503 when down)
