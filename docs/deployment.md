# Despliegue

1. Crea `.env` desde `.env.example`.
2. Cambia `COOKIE_SECRET` por un valor largo y aleatorio.
3. Mantén `PUBLISHED_HOST=127.0.0.1` para que Docker solo escuche localmente.
4. Construye y arranca:

```bash
docker compose up -d --build
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
