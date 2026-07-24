# Backup szkriptek – Vallordocs

Gyakorlati mentő/visszaállító szkriptek a [BACKUP.md](../../docs/BACKUP.md) és
[DISASTER_RECOVERY.md](../../docs/DISASTER_RECOVERY.md) stratégiához. Mindegyik
`set -euo pipefail`-lel fut, és **minden titkot környezeti változóból** olvas –
nincs beégetett hitelesítő adat.

| Szkript             | Feladat                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `db-backup.sh`      | PostgreSQL `pg_dump -Fc` mentés + integritás + opcionális feltöltés |
| `db-restore.sh`     | Visszaállítás dump-ból (`pg_restore --clean`, megerősítéssel)       |
| `storage-backup.sh` | Dokumentum-storage `rclone sync` a backup célba (tenant-szűrhető)   |

## Előfeltételek

- `pg_dump` / `pg_restore` (PostgreSQL client, a DB fő verziójához illő)
- `rclone` (ajánlott) vagy `aws` CLI az objektumtárolós fel-/letöltéshez

## Példák

```bash
# Adatbázis mentés helyi mappába + R2-be
DATABASE_URL="postgresql://..." \
BACKUP_S3_TARGET="r2:vallordocs-backups/db" \
  scripts/backup/db-backup.sh

# Visszaállítás (rombolo művelet, megerősítést kér)
scripts/backup/db-restore.sh ./backups/vallordocs-2026....dump "postgresql://..."

# Storage szinkron egyetlen tenantra
STORAGE_SOURCE="r2:vallordocs" \
STORAGE_BACKUP="r2:vallordocs-backups/storage" \
TENANT_ID="00000000-0000-0000-0000-000000000000" \
  scripts/backup/storage-backup.sh
```

## Ütemezés

Éles környezetben ezeket ütemezetten futtasd (Fly Machines cron / külső
scheduler): adatbázis óránként, storage naponta. Az ütemezést és megőrzést lásd
[BACKUP.md](../../docs/BACKUP.md).

> A szkriptek futtathatóvá tétele: `chmod +x scripts/backup/*.sh`.
