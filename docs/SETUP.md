# Fejlesztői útmutató – Vallordocs

## Követelmények

- Node.js ≥ 22
- Docker (helyi adatbázishoz és Redis-hez)
- Fly.io CLI (`flyctl`) a deploy-hoz

---

## Helyi fejlesztés

```bash
# 1. Függőségek telepítése
npm install

# 2. Titkos adatok másolása
cp .env.example .env
# Szerkeszd a .env fájlt: adj meg legalább JWT_SECRET értéket

# 3. Adatbázis és Redis indítása
docker compose up -d

# 4. Prisma migráció futtatása
npx prisma migrate dev --name init

# 5. Fejlesztői szerver indítása
npm run dev
```

Az alkalmazás: http://localhost:3000  
Health endpoint: http://localhost:3000/api/health

---

## Tesztek

```bash
npm test              # összes unit teszt
npm run test:watch    # watch mód
npm run test:coverage # lefedettség
```

---

## Fly.io telepítés

### Első alkalom

```bash
# 1. Bejelentkezés
fly auth login

# 2. Alkalmazás létrehozása (ha még nincs)
fly launch --no-deploy

# 3. Titkos adatok beállítása
fly secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  JWT_SECRET="legalabb-32-karakter-hosszu-titok" \
  GEMINI_API_KEY="AIza..." \
  STORAGE_PROVIDER="fly" \
  FLY_STORAGE_PATH="/data/storage"

# 4. Állandó kötet létrehozása
fly volumes create vallordocs_data --region fra --size 10

# 5. Deploy
fly deploy
```

### Frissítés

```bash
fly deploy
```

---

## Könyvtárszerkezet

```
/src
  /app         – Next.js App Router (locale-aware oldalak, API route-ok)
  /config      – Központi konfigurációs modul (env validáció)
  /i18n        – next-intl beállítások
  /lib         – Segédkönyvtárak (prisma singleton, utils)
  /middleware  – i18n middleware
  /modules     – Üzleti modulok (auth, ai, storage, …)
  /shared      – Megosztott típusok, hibakezelés
/prisma        – Adatbázis séma és migrációk
/messages      – Fordítási fájlok (hu.json, ro.json)
/public        – Statikus fájlok
/scripts       – Build és karbantartási szkriptek
/docs          – Dokumentáció
```

---

## Következő mérföldkő

A következő fejlesztési szakasz (Milestone 2) az autentikáció és a multi-tenant
rendszer felépítése. A PRD szerint minden lépést jóváhagyás előz meg.
