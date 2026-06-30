# Arquitectura

La aplicación separa responsabilidades para evitar archivos gigantes:

- `server.js` solo inicia y detiene el proceso.
- `app.js` registra plugins, seguridad, vistas y rutas.
- `routes/` traduce HTTP a llamadas de servicio.
- `services/` contiene reglas de aplicación y validación de flujo.
- `repositories/` encapsula SQL.
- `db/` mantiene conexión y esquema.
- `views/` contiene páginas y parciales EJS.
- `data/attachments/` guarda adjuntos locales por entrada.

El frontend es HTML renderizado en servidor con mejora progresiva. Las operaciones básicas funcionan mediante formularios HTML.
