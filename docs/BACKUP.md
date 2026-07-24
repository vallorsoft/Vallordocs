# Backup dokumentáció – Vallordocs

A Vallordocs négy adatosztályt véd rendszeres mentéssel: **adatbázis**,
**storage** (dokumentum-binárisok), **konfiguráció** és **audit napló**. Ez a
dokumentum a mentési stratégiát, ütemezést és megőrzést írja le. A helyreállítást
lásd [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md).

A gyakorlati szkriptek a [`scripts/backup/`](../scripts/backup/) mappában
találhatók.

---

## Áttekintés

| Adatosztály  | Forrás                      | Módszer                      | Gyakoriság         | Megőrzés                 |
| ------------ | --------------------------- | ---------------------------- | ------------------ | ------------------------ |
| Adatbázis    | PostgreSQL (`DATABASE_URL`) | `pg_dump` (custom formátum)  | óránként           | 7 nap PITR + 30 nap napi |
| Storage      | Fly Volume / R2 bucket      | objektum-szintű másolás/sync | naponta            | 30 nap                   |
| Konfiguráció | `fly secrets`, `fly.toml`   | titkosított export           | változáskor + heti | 90 nap                   |
| Audit napló  | `AuditLog` tábla            | append-only export (WORM)    | naponta            | ≥ 1 év                   |

> **RPO cél:** adatbázis ≤ 1 óra (PITR-rel percek), storage ≤ 24 óra.
> **RTO cél:** ≤ 1 óra (lásd DR).

---

## 1. Adatbázis mentés

A PostgreSQL a rendszer elsődleges igazságforrása (tenant-ek, felhasználók,
fuvarok, dokumentum-metaadatok, audit).

- **Folytonos védelem (PITR):** a menedzselt PostgreSQL (pl. Neon/Fly Postgres)
  Point-in-Time Recovery-t biztosít – bármely időpontra visszaállítható a
  megőrzési ablakon belül.
- **Logikai mentés:** óránként `pg_dump` custom (`-Fc`) formátumban, amit egy
  külön, a főrendszertől elkülönített tárolóba (R2/S3 bucket) töltünk.
  Lásd [`scripts/backup/db-backup.sh`](../scripts/backup/db-backup.sh).
- **Ellenőrzés:** minden mentés után `pg_restore --list` a dump integritásának
  igazolására; hetente egyszer teljes próba-visszaállítás egy eldobható
  adatbázisba (restore drill).

A séma migrációk verziózva vannak (`prisma/migrations`), így a séma maga a
repóból is helyreállítható.

---

## 2. Storage mentés

A dokumentum-binárisok (eredeti feltöltés, feldolgozott variáns, generált PDF) a
`StorageProvider` mögött élnek (Fly Volume vagy R2/S3 – lásd
[STORAGE.md](STORAGE.md)). A kulcsformátum:
`{tenantId}/documents/{tripId}/{documentId}/{variant}/{uuid}.{ext}`.

- **R2/S3 esetén:** bucket-szintű verziózás + napi cross-region replikáció egy
  külön backup bucketbe (`aws s3 sync` / `rclone sync`).
  Lásd [`scripts/backup/storage-backup.sh`](../scripts/backup/storage-backup.sh).
- **Fly Volume esetén:** a Fly automatikus napi volume snapshotjai (5 napig)
  kiegészítve napi `rclone`-szinkronnal egy objektumtárolóba a hosszabb
  megőrzésért.
- A tenant-prefix miatt egy tenant adata szelektíven is menthető/visszaállítható
  (GDPR-hordozhatóság, tenant-migráció).

---

## 3. Konfiguráció mentés

- A **nem titkos** konfiguráció (`fly.toml`, `.env.example`, workflow-k) a
  Git-ben verziózott – ez maga a mentés.
- A **titkok** (`DATABASE_URL`, `JWT_SECRET`, provider-kulcsok) a Fly secret
  store-ban élnek. Ezekről titkosított, offline export készül (pl. `age`/`gpg`
  titkosítással egy jelszószéfbe), amikor változnak, és hetente ellenőrizve.
  A titkok soha nem kerülnek plain szövegként mentésbe vagy a repóba.

---

## 4. Audit napló mentés

Az `AuditLog` append-only (a repository szándékosan nem tesz elérhetővé update-et
vagy delete-et – lásd [DATABASE.md](DATABASE.md)). A megfelelőség érdekében:

- Napi export egy **WORM** (Write-Once-Read-Many) tárolóba (pl. R2 Object Lock
  Compliance módban), így utólag nem módosítható.
- Megőrzés a jogszabályi/tenant retention policy szerint, de legalább **1 év**.
- Az exportot a `settings` modul retention-napjai nem törlik a WORM-példányból –
  a retention csak az élő tábla forgatását vezérli.

---

## Titkosítás és hozzáférés

- Minden mentés **nyugalmi titkosítással** (at-rest) tárolódik a célbuckében.
- A backup tároló hozzáférése a produkciós hozzáféréstől elkülönített, legkisebb
  jogosultság elvén (külön IAM/API kulcs, csak írás a backup jobból).
- A helyreállítási képességet rendszeres drill igazolja (lásd DR).

---

## Kapcsolódó dokumentumok

- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) – visszaállítási runbook
- [DATABASE.md](DATABASE.md) – adatmodell, append-only audit
- [STORAGE.md](STORAGE.md) – tárolási absztrakció, kulcsformátum
- [`scripts/backup/`](../scripts/backup/) – mentő szkriptek
