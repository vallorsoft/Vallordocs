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
| `users`         | M4        | 🔲 Boundary    | User profiles, roles, device management                                                      |
| `drivers`       | M4        | 🔲 Boundary    | Driver entities                                                                              |
| `trips`         | M4        | 🔲 Boundary    | Trips / freight orders                                                                       |
| `audit`         | M5        | 🔲 Boundary    | Append-only audit logging                                                                    |
| `notifications` | M5        | 🔲 Boundary    | In-app notifications (push-ready)                                                            |
| `settings`      | M5        | 🔲 Boundary    | Tenant-level configuration                                                                   |
| `dashboard`     | M5        | 🔲 Boundary    | Aggregated statistics & widgets                                                              |

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
