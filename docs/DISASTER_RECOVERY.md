# Disaster Recovery terv – Vallordocs

Ez a runbook a Vallordocs helyreállítását írja le nagyobb incidens (adatvesztés,
régió-kiesés, kompromittált titkok) esetén. A mentések készítését lásd
[BACKUP.md](BACKUP.md).

## Célok

| Mutató | Cél                                     |
| ------ | --------------------------------------- |
| RPO    | ≤ 1 óra (adatbázis PITR-rel percek)     |
| RTO    | ≤ 1 óra a szolgáltatás helyreállításáig |

Súlyossági szintek: **SEV1** teljes kiesés / adatvesztés · **SEV2** részleges
(egy alrendszer) · **SEV3** degradált működés.

---

## 0. Első lépések (minden incidensnél)

1. Incidens deklarálása, felelős (IC) kijelölése, kommunikációs csatorna nyitása.
2. A degradáció forrásának azonosítása: `GET /api/health` (per-probe státusz) és
   `GET /api/metrics`, Fly logok (`fly logs`), lásd [OBSERVABILITY.md](OBSERVABILITY.md).
3. Ha kompromittálás gyanúja áll fenn → **először titkok rotálása** (4. szakasz),
   csak utána visszaállítás.

---

## 1. Adatbázis visszaállítás

**PITR (elsődleges út):**

1. A menedzselt PostgreSQL konzolján válaszd az incidens előtti időpontot, és
   hozz létre egy új branch-et / instance-t erről a pontról.
2. Frissítsd a `DATABASE_URL` secretet az új instance-ra: `fly secrets set DATABASE_URL="..."`.
3. `npx prisma migrate deploy` (ha a séma újabb, mint a visszaállított pont).
4. `fly deploy` / `fly machines restart`, majd health-ellenőrzés.

**Logikai dump-ból (ha PITR nem elérhető):**

```bash
scripts/backup/db-restore.sh <dump-fájl> "$DATABASE_URL"
```

A dump `pg_restore -Fc` custom formátum. Visszaállítás után futtass egy
integritás-ellenőrzést (sorok száma tenant-enként, legutóbbi `AuditLog` időbélyeg).

---

## 2. Storage visszaállítás

1. Azonosítsd az érintett kulcs-prefixet – szükség esetén tenant-szinten
   (`{tenantId}/…`).
2. **R2/S3:** ha objektum-verziózás aktív, állítsd vissza az előző verziót; teljes
   veszteségnél `rclone sync <backup-bucket> <prod-bucket>` a kívánt prefixre.
3. **Fly Volume:** a legutóbbi volume snapshotból új volume, majd `fly volumes`
   csere; vagy `rclone`-nal a backup objektumtárolóból vissza a mountba.
4. A `StorageFile` DB-sorok és a tényleges objektumok konzisztenciáját ellenőrizd
   (kulcs létezik-e minden `ready` dokumentumhoz).

---

## 3. Redis újraépítés

A Redis (BullMQ) a job-sor **tranziens** állapotát tartja, nem tartós igazságforrás.

1. Indíts új, üres Redis instance-t, frissítsd a `REDIS_URL` secretet.
2. A félbemaradt AI feladatok újraütemezése az adatbázis a forrás: a `queued` /
   `processing` / `retrying` állapotú `AiJob` sorok alapján a feldolgozó
   újraépíti a sort (a `document.ai_process` idempotens a `documentId`-ra).
3. Nincs szükség Redis-visszaállításra mentésből – a sor determinisztikusan
   újraépíthető a DB-ből.

---

## 4. Titkos kulcsok cseréje (rotáció)

Kompromittálás vagy tervezett rotáció esetén:

| Titok            | Hatás rotációkor                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Minden kiadott access **és** refresh token azonnal érvénytelen → minden felhasználó újra bejelentkezik. |
| `DATABASE_URL`   | Kapcsolati adat cseréje; jelszó a DB oldalon is rotálandó.                                              |
| `GEMINI_API_KEY` | AI feldolgozás áll, amíg az új kulcs nem él.                                                            |
| `R2_*` kulcsok   | Storage hozzáférés; a régi kulcsot a provider oldalon visszavonni.                                      |

```bash
fly secrets set JWT_SECRET="$(openssl rand -base64 48)"
# a deploy automatikusan újraindul; a refresh tokenek táblája (hash) elavul
```

A `RefreshToken` sorok hash-eltek; a `JWT_SECRET` rotáció után ezek amúgy sem
validálnak, célszerű a lejárt/elavult sorokat a retention job-bal takarítani.

---

## 5. Teljes rendszer helyreállítás (SEV1, régió-kiesés)

1. **Infra:** `fly deploy` egy másodlagos régióba (`primary_region` átállítása a
   `fly.toml`-ban vagy `fly regions add`).
2. **Adatbázis:** PITR/replika előléptetése az új régióban (1. szakasz).
3. **Storage:** a backup bucketből sync az elsődlegesbe (2. szakasz).
4. **Titkok:** a Fly secret store régió-független; ellenőrizd, hogy minden
   kötelező secret jelen van (`fly secrets list`).
5. **Sor:** új Redis + újraépítés a DB-ből (3. szakasz).
6. **Validáció:** `GET /api/health` minden probe `ok`; egy tenant end-to-end
   próbája (bejelentkezés → dokumentum lista → dashboard).
7. **DNS/URL:** ha az `APP_URL` változik, frissítsd a secretet és az esetleges
   egyedi domaint.

---

## Utólagos teendők

- Incidens post-mortem (idővonal, kiváltó ok, javító intézkedések).
- A DR drill eredményének rögzítése; RPO/RTO tényleges vs. cél.
- A hiányzó automatizáció visszavezetése a `scripts/`-be.

## Kapcsolódó dokumentumok

- [BACKUP.md](BACKUP.md) – mentési stratégia
- [OBSERVABILITY.md](OBSERVABILITY.md) – health, metrikák, riasztás
- [DEPLOY.md](DEPLOY.md) – deploy és secret kezelés
