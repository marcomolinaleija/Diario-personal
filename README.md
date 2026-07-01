# Diario Privado

Aplicación web privada para llevar un diario personal. Está pensada para usarse detrás de Tailscale, con backend Node.js, SQLite persistente y una interfaz accesible.

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

La base SQLite vive en `./data/diario.sqlite`, montada como volumen dentro del contenedor. Los adjuntos viven en `./data/attachments/`.

## Imagen Publica

El proyecto puede publicarse en GitHub Container Registry como:

```txt
ghcr.io/marcomolinaleija/diario-personal:latest
```

Para usar la imagen publicada sin compilar localmente:

```bash
cp .env.example .env
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

La imagen se publica automaticamente desde `main` y desde tags `v*.*.*` con GitHub Actions.

## Versiones

Para publicar una version estable:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions publicara:

```txt
ghcr.io/marcomolinaleija/diario-personal:v1.0.0
```

Para usar una version fija en vez de `latest`:

```bash
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.image.yml pull
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.image.yml up -d
```

Para volver atras, usa una version anterior:

```bash
IMAGE_TAG=v0.9.0 docker compose -f docker-compose.image.yml up -d
```

## Tailscale Serve

Esta VPS usa Tailscale Serve para exponer el diario solo dentro de la tailnet:

```txt
https://journal.example.ts.net/
```

Docker publica el backend solo en localhost:

```txt
PUBLISHED_HOST=127.0.0.1
```

La regla activa de Tailscale Serve es:

```txt
https://journal.example.ts.net/
-> http://127.0.0.1:3000
```

## Estructura

```txt
app/src/app.js                 Registra Fastify, plugins y rutas
app/src/server.js              Arranque y apagado ordenado
app/src/routes/                Rutas HTTP
app/src/services/              Reglas de aplicación
app/src/repositories/          Consultas SQLite
app/src/db/                    Conexión y esquema
app/views/                     Plantillas EJS
app/public/                    CSS y JS
data/                          SQLite persistente y adjuntos
```

## Backups

Incluye `scripts/backup-diario.sh` para crear un backup consistente de SQLite, empaquetar adjuntos y subirlo con `rclone` a Backblaze B2 u otro remoto compatible.

Si `MAIL_ENABLED=true`, el script envia un correo de confirmacion cuando el backup se completa o falla. Puedes desactivar solo esos correos con `BACKUP_MAIL_ENABLED=false`.

## Adjuntos

Desde la lectura de una entrada puedes subir archivos pequeños. La app muestra un snippet como:

```txt
[[attachment:3]]
```

Pega ese snippet dentro del Markdown para renderizar el adjunto en esa posición. Las imágenes se muestran como imagen, los audios como reproductor y el resto como enlace de descarga.

## Racha y Correos

La página de estadísticas muestra racha activa, racha más larga y días escritos. También incluye la lista de escenarios de recordatorios por correo.

Los correos están desactivados por defecto. Actívalos en `.env` con:

```txt
MAIL_ENABLED=true
MAIL_TO=you@example.com
MAIL_FROM=diario@tu-dominio
SMTP_HOST=host.docker.internal
SMTP_PORT=587
SMTP_TLS_SERVERNAME=mail.example.com
SMTP_USER=usuario-smtp
SMTP_PASS=clave-smtp
```
