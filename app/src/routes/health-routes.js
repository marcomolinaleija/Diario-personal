export async function registerHealthRoutes(app) {
  app.get('/health', async () => ({
    ok: true,
    service: 'diario-privado'
  }));
}
