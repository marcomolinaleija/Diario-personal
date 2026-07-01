#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DATA_DIR:-$ROOT_DIR/data}"
SQLITE_DB="${SQLITE_DB:-$DATA_DIR/diario.sqlite}"
ATTACHMENTS_DIR="${ATTACHMENTS_DIR:-$DATA_DIR/attachments}"
BACKUP_DIR="${BACKUP_DIR:-$DATA_DIR/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-b2diario:diario-personal-backups}"
RCLONE_PREFIX="${RCLONE_PREFIX:-backups/diario/daily}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-14}"
BACKUP_MAIL_ENABLED="${BACKUP_MAIL_ENABLED:-true}"

timestamp="$(date '+%Y-%m-%d_%H-%M-%S')"
started_at="$(date -Iseconds)"
work_dir="$(mktemp -d)"
backup_name="diario-${timestamp}.tar.gz"
archive_path="$BACKUP_DIR/$backup_name"
remote_path="$RCLONE_REMOTE/$RCLONE_PREFIX/$backup_name"
archive_size_bytes=""

cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

send_backup_notification() {
  local status="$1"
  local exit_code="${2:-0}"
  local error_line="${3:-}"

  if [[ "$BACKUP_MAIL_ENABLED" != "true" ]]; then
    return 0
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "No se pudo enviar correo de backup: docker no esta disponible." >&2
    return 0
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "No se pudo enviar correo de backup: docker compose no esta disponible." >&2
    return 0
  fi

  local compose_command=(docker compose run --rm --no-deps)

  if docker compose ps --status running --services 2>/dev/null | grep -qx 'diario'; then
    compose_command=(docker compose exec -T)
  fi

  "${compose_command[@]}" \
    -e "BACKUP_STATUS=$status" \
    -e "BACKUP_STARTED_AT=$started_at" \
    -e "BACKUP_FINISHED_AT=$(date -Iseconds)" \
    -e "BACKUP_ARCHIVE_PATH=$archive_path" \
    -e "BACKUP_REMOTE_PATH=$remote_path" \
    -e "BACKUP_SIZE_BYTES=$archive_size_bytes" \
    -e "BACKUP_LOCAL_RETENTION_DAYS=$LOCAL_RETENTION_DAYS" \
    -e "BACKUP_EXIT_CODE=$exit_code" \
    -e "BACKUP_ERROR_LINE=$error_line" \
    diario node src/cli/send-backup-notification.js >/dev/null || \
    echo "No se pudo enviar correo de backup." >&2
}

handle_error() {
  local exit_code="$1"
  local error_line="$2"
  send_backup_notification "failure" "$exit_code" "$error_line"
  exit "$exit_code"
}

trap 'handle_error "$?" "$LINENO"' ERR

if [[ ! -f "$SQLITE_DB" ]]; then
  echo "No existe la base SQLite: $SQLITE_DB" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
mkdir -p "$work_dir/diario"

sqlite3 "$SQLITE_DB" ".backup '$work_dir/diario/diario.sqlite'"

if [[ -d "$ATTACHMENTS_DIR" ]]; then
  cp -a "$ATTACHMENTS_DIR" "$work_dir/diario/attachments"
fi

cat > "$work_dir/diario/README.txt" <<EOF
Backup del diario personal
Fecha: $(date -Iseconds)

Contenido:
- diario.sqlite
- attachments/ si existía al crear el backup
EOF

tar -czf "$archive_path" -C "$work_dir" diario
archive_size_bytes="$(wc -c < "$archive_path" | tr -d ' ')"
rclone copyto "$archive_path" "$remote_path"

find "$BACKUP_DIR" -type f -name 'diario-*.tar.gz' -mtime "+$LOCAL_RETENTION_DAYS" -delete

send_backup_notification "success"

echo "Backup creado: $archive_path"
echo "Backup subido: $remote_path"
