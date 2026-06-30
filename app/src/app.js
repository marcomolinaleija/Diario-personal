import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import Fastify from 'fastify';
import ejs from 'ejs';
import { env } from './config/env.js';
import { runMigrations } from './db/connection.js';
import { csrfPlugin } from './utils/csrf.js';
import { renderMarkdown } from './utils/markdown.js';
import { excerpt, formatDate, formatDateTime, formatWritingRange } from './utils/view-data.js';
import { registerCalendarRoutes } from './routes/calendar-routes.js';
import { registerAttachmentsRoutes } from './routes/attachments-routes.js';
import { registerEntriesRoutes } from './routes/entries-routes.js';
import { registerExportRoutes } from './routes/export-routes.js';
import { registerHealthRoutes } from './routes/health-routes.js';
import { registerMilestonesRoutes } from './routes/milestones-routes.js';
import { registerStatsRoutes } from './routes/stats-routes.js';
import { startStreakNotificationScheduler } from './services/streak-notification-service.js';

export async function buildApp() {
  runMigrations();

  const app = Fastify({
    logger: true,
    bodyLimit: 1024 * 128
  });

  app.decorate('config', {
    IS_PRODUCTION: env.isProduction
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  });

  await app.register(fastifyCookie, {
    secret: env.cookieSecret
  });

  await app.register(fastifyFormbody);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1
    }
  });
  await app.register(csrfPlugin);

  await app.register(fastifyStatic, {
    root: env.publicDir,
    prefix: '/public/'
  });

  await app.register(fastifyView, {
    engine: { ejs },
    root: env.viewsDir,
    viewExt: 'ejs',
    options: {
      _with: false,
      localsName: 'locals'
    },
    defaultContext: {
      formatDate,
      formatDateTime,
      formatWritingRange,
      renderMarkdown,
      excerpt
    }
  });

  await app.register(registerHealthRoutes);
  await app.register(registerCalendarRoutes);
  await app.register(registerMilestonesRoutes);
  await app.register(registerStatsRoutes);
  await app.register(registerExportRoutes);
  await app.register(registerAttachmentsRoutes);
  await app.register(registerEntriesRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).view('errors/404.ejs', {
      appName: env.appName,
      title: 'Página no encontrada',
      currentPath: request.url,
      csrfToken: reply.ensureCsrfToken()
    });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.code(500).view('errors/500.ejs', {
      appName: env.appName,
      title: 'Error interno',
      currentPath: request.url,
      csrfToken: reply.ensureCsrfToken()
    });
  });

  startStreakNotificationScheduler(app.log);

  return app;
}
