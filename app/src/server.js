import { buildApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './db/connection.js';

const app = await buildApp();

const shutdown = async () => {
  app.log.info('Cerrando servidor...');
  await app.close();
  closeDatabase();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await app.listen({ host: env.host, port: env.port });
} catch (error) {
  app.log.error(error);
  closeDatabase();
  process.exit(1);
}
