#!/usr/bin/env bash
#
# db-restore.sh — PostgreSQL visszaállítás dump-ból (Vallordocs)
#
# Egy pg_dump -Fc custom dump-ot állít vissza a megadott adatbázisba. Mivel ez
# ROMBOLÓ művelet (--clean), megerősítést kér, hacsak a FORCE=1 nincs beállítva.
#
# Használat:
#   scripts/backup/db-restore.sh <dump-fájl> <DATABASE_URL>
#   FORCE=1 scripts/backup/db-restore.sh backup.dump "postgresql://..."
set -euo pipefail

DUMP_FILE="${1:?Használat: db-restore.sh <dump-fájl> <DATABASE_URL>}"
TARGET_URL="${2:?Használat: db-restore.sh <dump-fájl> <DATABASE_URL>}"

[[ -f "${DUMP_FILE}" ]] || { echo "[db-restore] nincs ilyen fájl: ${DUMP_FILE}" >&2; exit 1; }

echo "[db-restore] integritás-ellenőrzés"
pg_restore --list "${DUMP_FILE}" > /dev/null

if [[ "${FORCE:-0}" != "1" ]]; then
  echo "FIGYELEM: ez felülírja a cél adatbázis tartalmát (--clean)."
  read -r -p "Folytatod? (ír: yes) " answer
  [[ "${answer}" == "yes" ]] || { echo "megszakítva"; exit 1; }
fi

echo "[db-restore] visszaállítás → cél DB"
pg_restore \
  --clean --if-exists \
  --no-owner --no-privileges \
  --dbname="${TARGET_URL}" \
  "${DUMP_FILE}"

echo "[db-restore] kész. Futtasd szükség esetén: npx prisma migrate deploy"
