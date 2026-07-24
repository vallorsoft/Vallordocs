# Deploy dokumentáció – Vallordocs

Ez a dokumentum a Vallordocs éles üzembe helyezését írja le. A rendszer egyetlen
Next.js (App Router) alkalmazásként fut (Modular Monolith), Docker konténerbe
csomagolva, a [Fly.io](https://fly.io) platformon.

Kapcsolódó: [ARCHITECTURE.md](ARCHITECTURE.md) · [OBSERVABILITY.md](OBSERVABILITY.md) ·
[BACKUP.md](BACKUP.md) · [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)

---

## Áttekintés

| Elem         | Érték                                                |
| ------------ | ---------------------------------------------------- |
| Platform     | Fly.io                                               |
| App név      | `vallordocs`                                         |
| Régió        | `fra` (Frankfurt, EU)                                |
| URL          | `https://vallordocs.fly.dev`                         |
| Konténer     | `Dockerfile` (multi-stage, Node 22)                  |
| Belső port   | `8080` (`PORT` env)                                  |
| Health check | `GET /api/health` (30 s intervallum)                 |
| Metrikák     | `GET /api/metrics` (Prometheus) – lásd OBSERVABILITY |

Az adatbázis (PostgreSQL) és a Redis (BullMQ sorhoz) menedzselt szolgáltatásként
fut; ezek kapcsolati adatai Fly secret-ként érkeznek.

---

## Environment változók

A teljes lista a projekt gyökér `.env.example` fájljában található. Az alkalmazás
induláskor validálja őket (`src/config/env.ts`), és hibás/hiányzó kötelező érték
esetén **nem indul el**.

### Nem titkos (fly.toml `[env]`)

| Változó            | Éles érték                   |
| ------------------ | ---------------------------- |
| `NODE_ENV`         | `production`                 |
| `PORT`             | `8080`                       |
| `DEFAULT_LANGUAGE` | `hu`                         |
| `DEFAULT_TIMEZONE` | `Europe/Budapest`            |
| `LOG_LEVEL`        | `info`                       |
| `APP_URL`          | `https://vallordocs.fly.dev` |

### Titkos (`fly secrets set`)

| Változó                                                        | Leírás                                        |
| -------------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`                                                 | PostgreSQL kapcsolat (kötelező)               |
| `REDIS_URL`                                                    | Redis kapcsolat a BullMQ sorhoz               |
| `JWT_SECRET`                                                   | Min. 32 karakter, token aláíráshoz (kötelező) |
| `GEMINI_API_KEY`                                               | AI provider kulcs (ha `AI_PROVIDER=gemini`)   |
| `STORAGE_PROVIDER`                                             | `fly` \| `r2` \| `s3` \| `azure` \| `gcs`     |
| `FLY_STORAGE_PATH`                                             | Fly Volume mount útvonala (ha `fly`)          |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` | Csak `STORAGE_PROVIDER=r2` esetén             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`         | Kimenő levél (opcionális)                     |

> A titkos értékek soha nem kerülnek a repóba és nem jelennek meg a
> `fly.toml [env]` szekcióban. Rotációjukat lásd [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md).

---

## Docker build

A `Dockerfile` több lépcsős build-et használ (deps → builder → runner), és a
Next.js standalone kimenetét futtatja Node 22 alatt. Helyi build:

```bash
docker build -t vallordocs:local .
docker run --rm -p 8080:8080 --env-file .env vallordocs:local
```

A `docker-compose.yml` a helyi fejlesztéshez PostgreSQL-t és Redis-t indít
(lásd [SETUP.md](SETUP.md)).

---

## Első üzembe helyezés

```bash
# 1. App összekötése (deploy nélkül)
fly launch --no-deploy

# 2. Titkok beállítása
fly secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  JWT_SECRET="$(openssl rand -base64 48)" \
  STORAGE_PROVIDER="r2" \
  R2_ACCOUNT_ID="..." R2_ACCESS_KEY="..." R2_SECRET_KEY="..." R2_BUCKET="..."

# 3. Adatbázis séma migrálása (out-of-band, lásd lentebb)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 4. Deploy
fly deploy
```

### Adatbázis migráció

A migráció **nem** fut a konténer indításakor (ez korábban blokkolta a boot-ot).
Az `prisma migrate deploy` külön, kontrollált lépésként fut – a deploy pipeline
előtt vagy egy egyszeri release feladatként. Így egy rossz migráció nem
akadályozza meg a szerver elindulását.

---

## CI/CD pipeline (GitHub Actions)

Két workflow van a `.github/workflows/` alatt:

### `ci.yml` – minden push / PR

A PRD 6. fejezet szerinti sorrend:

1. **Install** – `npm ci`
2. **Prisma generate** – kliens típusok
3. **Lint** – `npm run lint`
4. **Format check** – `npm run format:check`
5. **Type check** – `npm run typecheck`
6. **Unit & integration teszt** – `npm test`
7. **Build** – `npm run build`

Sikertelen lépés esetén a pipeline megáll, és a `deploy` nem indul el.

### `deploy.yml` – csak `main` branch

1. `flyctl` beállítása
2. **Preflight**: a `FLY_API_TOKEN` secret meglétének és érvényességének
   ellenőrzése – korai, érthető hibaüzenettel, még a build előtt.
3. `fly deploy`

A `FLY_API_TOKEN`-t a GitHub repo _Settings → Secrets and variables → Actions_
alatt kell beállítani.

---

## Health és rollout

- A Fly a `GET /api/health` végpontot pingeli 30 másodpercenként (`grace_period`
  15 s). A végpont a `database` probe-ot valós `SELECT 1`-gyel ellenőrzi; `down`
  állapotnál `503`-at ad, és a Fly nem irányít rá forgalmat.
- `min_machines_running = 1`, `auto_start/stop_machines = true` – legalább egy
  gép mindig fut, terhelés esetén automatikus skálázás.
- Rollback: `fly releases` a verziólista, `fly deploy --image <előző-image>`
  vagy `fly releases rollback` az előző kiadásra.

---

## Kapcsolódó dokumentumok

- [OBSERVABILITY.md](OBSERVABILITY.md) – health, metrikák, tracing
- [BACKUP.md](BACKUP.md) – mentési stratégia
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) – helyreállítási terv
- [DATABASE.md](DATABASE.md) – séma és migráció
