#!/usr/bin/env bash
#
# db-backup.sh — PostgreSQL logikai mentés (Vallordocs)
#
# Egy custom-formátumú (pg_dump -Fc) dump-ot készít, integritás-ellenőrzéssel,
# majd opcionálisan egy objektumtárolóba tölti. Titkot NEM tartalmaz: minden
# érzékeny adat környezeti változóból jön.
#
# Kötelező env:
#   DATABASE_URL         a menteni kívánt adatbázis kapcsolati stringje
# Opcionális env:
#   BACKUP_DIR           helyi célmappa (alap: ./backups)
#   BACKUP_S3_TARGET     rclone/aws cél, pl. "r2:vallordocs-backups/db" (ha üres, csak helyi)
#   RETENTION_DAYS       helyi dump-ok megőrzése napokban (alap: 30)
#
# Használat:
#   DATABASE_URL="postgresql://..." scripts/backup/db-backup.sh
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL kötelező}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTFILE="${BACKUP_DIR}/vallordocs-${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[db-backup] dump → ${OUTFILE}"
pg_dump --format=custom --no-owner --no-privileges --dbname="${DATABASE_URL}" --file="${OUTFILE}"

echo "[db-backup] integritás-ellenőrzés (pg_restore --list)"
pg_restore --list "${OUTFILE}" > /dev/null

if [[ -n "${BACKUP_S3_TARGET:-}" ]]; then
  echo "[db-backup] feltöltés → ${BACKUP_S3_TARGET}"
  if command -v rclone > /dev/null; then
    rclone copy "${OUTFILE}" "${BACKUP_S3_TARGET}"
  elif command -v aws > /dev/null; then
    aws s3 cp "${OUTFILE}" "${BACKUP_S3_TARGET%/}/$(basename "${OUTFILE}")"
  else
    echo "[db-backup] FIGYELEM: sem rclone, sem aws nem elérhető, kihagyva a feltöltést" >&2
  fi
fi

echo "[db-backup] régi helyi dump-ok törlése (> ${RETENTION_DAYS} nap)"
find "${BACKUP_DIR}" -name 'vallordocs-*.dump' -type f -mtime "+${RETENTION_DAYS}" -delete || true

echo "[db-backup] kész: ${OUTFILE}"
