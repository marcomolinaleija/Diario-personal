# Despliegue

1. Crea `.env` desde `.env.example`.
2. Cambia `COOKIE_SECRET` por un valor largo y aleatorio.
3. Mantén `PUBLISHED_HOST=127.0.0.1` para que Docker solo escuche localmente.
4. Construye y arranca:

```bash
docker compose up -d --build
```

Si prefieres usar la imagen publicada en GHCR en vez de construir localmente:

```bash
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

Imagen:

```txt
ghcr.io/marcomolinaleija/diario-personal:latest
```

Para fijar una version concreta:

```bash
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.image.yml pull
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.image.yml up -d
```

Para volver a una version anterior:

```bash
IMAGE_TAG=v0.9.0 docker compose -f docker-compose.image.yml pull
IMAGE_TAG=v0.9.0 docker compose -f docker-compose.image.yml up -d
```

Publicar una nueva version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

5. Comprueba el estado:

```bash
curl http://127.0.0.1:3000/health
```

6. Publica el servicio con Tailscale Serve:

```bash
tailscale serve --bg --https 10445 http://127.0.0.1:3000
```

7. Accede desde tu tailnet:

```txt
https://journal.example.ts.net/
```

El archivo SQLite está en `./data/diario.sqlite`. Los adjuntos están en `./data/attachments/`.

Para backup, respalda ambos:

```txt
./data/diario.sqlite
./data/attachments/
```

## Backups con Backblaze B2

El script `scripts/backup-diario.sh` crea una copia consistente de SQLite, incluye adjuntos y sube un `.tar.gz` a Backblaze mediante `rclone`.

Valores por defecto:

```txt
RCLONE_REMOTE=b2diario:diario-personal-backups
RCLONE_PREFIX=backups/diario/daily
LOCAL_RETENTION_DAYS=14
BACKUP_MAIL_ENABLED=true
```

Ejecutar manualmente:

```bash
./scripts/backup-diario.sh
```

El archivo subido contiene:

```txt
diario/
  diario.sqlite
  attachments/
  README.txt
```

Los backups locales quedan en `./data/backups/` y no se versionan.

Si `MAIL_ENABLED=true`, el script envia correo cuando el backup se completa o falla. Para mantener los recordatorios del diario activos pero silenciar los correos de backup, ejecuta el script con `BACKUP_MAIL_ENABLED=false`.

El servicio de `systemd` incluido en `deploy/` ejecuta el backup como el usuario `marco` para usar su configuracion de `rclone`.

## Correo de racha

Los recordatorios de racha están desactivados por defecto. Para activarlos, configura SMTP en `.env`:

```txt
MAIL_ENABLED=true
MAIL_TO=you@example.com
MAIL_FROM=diario@tu-dominio
SMTP_HOST=host.docker.internal
SMTP_PORT=587
SMTP_SECURE=false
SMTP_TLS_SERVERNAME=mail.example.com
SMTP_USER=usuario-smtp
SMTP_PASS=clave-smtp
STREAK_CHECK_HOUR=20
```

Si Mailcow permite relay local sin autenticación, puedes dejar `SMTP_USER` y `SMTP_PASS` vacíos y usar `SMTP_PORT=25`. El contenedor resuelve `host.docker.internal` hacia el host Docker.
