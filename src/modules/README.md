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

| Module          | Responsibility                                               |
| --------------- | ------------------------------------------------------------ |
| `auth`          | Authentication, sessions, RBAC enforcement                   |
| `tenants`       | Tenant lifecycle, settings, isolation                        |
| `users`         | User profiles, roles, device management                      |
| `drivers`       | Driver entities                                              |
| `trips`         | Trips / freight orders                                       |
| `documents`     | Documents, versions, multi-page handling                     |
| `ai`            | AI provider abstraction & document restoration orchestration |
| `storage`       | Pluggable storage provider (Fly Volume, R2, …)               |
| `audit`         | Append-only audit logging                                    |
| `notifications` | In-app notifications (push-ready)                            |
| `settings`      | Tenant-level configuration                                   |
| `dashboard`     | Aggregated statistics & widgets                              |

Each module is populated in its own milestone. This foundation milestone only
establishes the boundaries.
