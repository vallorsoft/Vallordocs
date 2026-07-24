# Vallordocs

> Intelligens dokumentum-helyreállító SaaS rendszer fuvarozó vállalatok számára (HU/RO).

**URL:** https://vallordocs.fly.dev  
**Stack:** Next.js 15 · TypeScript strict · Neon PostgreSQL · Prisma · BullMQ · Gemini AI · Fly.io

---

## Rövid összefoglaló

A sofőr lefotózza a fuvardokumentumot mobilján. A rendszer automatikusan professzionális, szkennelt minőségű A4 PDF-et készít belőle – perspektívajavítással, árnyékeltávolítással, kontrasztoptimalizálással – a dokumentum tartalmának módosítása nélkül.

**Alapelvek:** Clean Architecture · Modular Monolith · Multi-Tenant · GDPR · Security by Design · AI First · Offline First

---

## Dokumentáció

| Dokumentum                                             | Tartalom                                  |
| ------------------------------------------------------ | ----------------------------------------- |
| [docs/SETUP.md](docs/SETUP.md)                         | Fejlesztői és deployment útmutató         |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)           | Rendszer- és modularchitektúra, diagramok |
| [docs/DATABASE.md](docs/DATABASE.md)                   | Adatmodell és ER diagram                  |
| [docs/API.md](docs/API.md)                             | REST API végpontok (v1)                   |
| [docs/UI.md](docs/UI.md)                               | Admin konzol és Driver PWA felület        |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md)             | Szerepkörök, jogosultságok, RBAC mátrix   |
| [docs/AUTH.md](docs/AUTH.md)                           | Hitelesítés, JWT, munkamenet              |
| [docs/AI.md](docs/AI.md)                               | AI helyreállítási folyamat és guardrailek |
| [docs/STORAGE.md](docs/STORAGE.md)                     | Tárolási absztrakció és folyamat          |
| [docs/DEPLOY.md](docs/DEPLOY.md)                       | Deploy (Fly.io), CI/CD, env változók      |
| [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)         | Health, metrikák, tracing, teljesítmény   |
| [docs/BACKUP.md](docs/BACKUP.md)                       | Mentési stratégia                         |
| [docs/DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md) | Katasztrófa-helyreállítási terv           |
| [scripts/backup/](scripts/backup/)                     | Mentő/visszaállító szkriptek              |
| [PRD.md](PRD.md)                                       | Teljes rendszerspecifikáció               |
| [src/modules/README.md](src/modules/README.md)         | Modul határok és szabályok                |

---

## Gyors indítás

```bash
npm install
cp .env.example .env   # szerkeszd a .env fájlt
docker compose up -d   # adatbázis + redis
npx prisma migrate dev --name init
npm run dev
```

Részletes útmutató: [docs/SETUP.md](docs/SETUP.md)
