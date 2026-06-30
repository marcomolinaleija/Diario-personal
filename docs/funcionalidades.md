# Funcionalidades del Diario Personal

Este proyecto es un diario personal autoalojado, pensado para ejecutarse en una VPS o equipo propio y accederse de forma privada, por ejemplo mediante Tailscale Serve.

## Escritura

- Crear entradas con título, fecha, hora y etiquetas.
- Editar entradas existentes sin perder el texto original.
- Eliminar entradas con confirmación.
- Registrar automáticamente el rango de escritura: inicio y fin de actividad en el formulario.
- Usar Markdown en el cuerpo de la entrada.
- Renderizar Markdown de forma segura, bloqueando HTML peligroso.

## Lectura

- Lista de entradas ordenada por fecha.
- Paginación configurable en la lista de entradas.
- Vista de lectura individual.
- Enlaces para volver a la lista desde la parte superior e inferior de la entrada.
- Búsqueda por título, contenido y etiquetas.
- Visualización de fecha, hora y rango "escrito de X a Y".

## Calendario

- Vista mensual del diario.
- Conteo de entradas por día.
- Navegación entre mes anterior y mes siguiente.
- Vista de entradas por día.

## Adjuntos

- Subida de archivos pequeños asociados a una entrada.
- Límite de 5 MB por archivo.
- Tipos contemplados:
  - imágenes;
  - archivos de texto;
  - Markdown;
  - CSV;
  - JSON;
  - PDF;
  - audio.
- Cada adjunto genera un marcador como:

```txt
[[attachment:3]]
```

Al pegar ese marcador dentro del Markdown:

- las imágenes se renderizan como imagen;
- los audios se renderizan como reproductor;
- los demás archivos se renderizan como enlace de descarga.

Si una entrada se elimina, también se eliminan sus adjuntos físicos.

## Estadísticas

- Total de entradas.
- Caracteres escritos.
- Palabras aproximadas.
- Periodo cubierto por el diario.
- Entradas por año.
- Entradas por mes.
- Racha activa.
- Racha más larga.
- Días escritos.
- Última entrada registrada.
- Paginación configurable en la lista de hitos personales.

## Rachas y Recordatorios

El diario calcula rachas por días distintos con al menos una entrada. Varias entradas en un mismo día cuentan como un solo día de racha.

El sistema de recordatorios por correo contempla escenarios como:

- primera entrada;
- racha iniciada;
- semana completa;
- mes muy activo;
- mes casi diario;
- regreso después de varios días, semanas o meses;
- riesgo de perder una racha;
- varios días sin escribir;
- hitos de racha, desde 2 días hasta 730 días.

Los correos son configurables mediante variables de entorno y se deduplican por día para evitar avisos repetidos.

## Exportación

El diario puede exportar:

- una entrada individual;
- todo el diario;
- un año completo;
- un mes específico.

Formatos disponibles:

- Markdown;
- JSON;
- ZIP.

Los ZIP incluyen una estructura organizada:

```txt
README.md
diario.md
diario.json
YYYY/
  MM/
    DD/
      HHMM-id-titulo.md
```

## Privacidad y Datos

La aplicación está pensada para ser local-first:

- SQLite como base de datos principal.
- Adjuntos guardados localmente en `data/attachments/`.
- Sin dependencia de servicios externos para funcionar.
- Acceso recomendado por una red privada como Tailscale.

No se versionan:

- `.env`;
- bases SQLite;
- archivos WAL/SHM;
- adjuntos;
- dependencias instaladas.

## Accesibilidad

La interfaz usa HTML semántico y busca ser usable con teclado y lectores de pantalla:

- enlaces claros;
- botones reales para acciones;
- labels asociados a formularios;
- mensajes de error conectados;
- foco visible;
- contraste alto;
- diseño responsive.

## Licencia

El proyecto incluye licencia Unlicense en el archivo `LICENSE`.

Esto permite copiar, modificar, publicar, compilar, vender o distribuir el código, con o sin cambios, para fines comerciales o no comerciales.
