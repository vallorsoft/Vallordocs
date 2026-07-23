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

| Dokumentum                                     | Tartalom                          |
| ---------------------------------------------- | --------------------------------- |
| [docs/SETUP.md](docs/SETUP.md)                 | Fejlesztői és deployment útmutató |
| [PRD.md](PRD.md)                               | Teljes rendszerspecifikáció       |
| [src/modules/README.md](src/modules/README.md) | Modul határok és szabályok        |

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
