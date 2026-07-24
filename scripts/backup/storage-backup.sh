#!/usr/bin/env bash
#
# storage-backup.sh — dokumentum-storage szinkron a backup tárolóba (Vallordocs)
#
# A StorageProvider mögötti objektumokat (eredeti / feldolgozott / pdf variánsok)
# szinkronizálja egy külön backup célba. Opcionálisan egyetlen tenant prefixére
# szűkíthető (GDPR-hordozhatóság, tenant-migráció).
#
# Kötelező env:
#   STORAGE_SOURCE   forrás, pl. "r2:vallordocs" vagy egy helyi mount útvonal
#   STORAGE_BACKUP   cél, pl. "r2:vallordocs-backups/storage"
# Opcionális env:
#   TENANT_ID        ha megadva, csak a "{TENANT_ID}/" prefixet szinkronizálja
#
# Használat:
#   STORAGE_SOURCE="r2:vallordocs" STORAGE_BACKUP="r2:vallordocs-backups/storage" \
#     scripts/backup/storage-backup.sh
set -euo pipefail

: "${STORAGE_SOURCE:?STORAGE_SOURCE kötelező}"
: "${STORAGE_BACKUP:?STORAGE_BACKUP kötelező}"

command -v rclone > /dev/null || { echo "[storage-backup] rclone szükséges" >&2; exit 1; }

SRC="${STORAGE_SOURCE}"
DST="${STORAGE_BACKUP}"
if [[ -n "${TENANT_ID:-}" ]]; then
  SRC="${SRC%/}/${TENANT_ID}"
  DST="${DST%/}/${TENANT_ID}"
  echo "[storage-backup] tenant-szűkített szinkron: ${TENANT_ID}"
fi

echo "[storage-backup] sync ${SRC} → ${DST}"
# --immutable: már meglévő objektumot nem ír felül (védelem véletlen felülírás ellen)
rclone sync "${SRC}" "${DST}" --immutable --transfers 8 --checksum

echo "[storage-backup] kész"
