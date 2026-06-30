import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '../..');

export const env = {
  appName: process.env.APP_NAME || 'Diario Personal',
  appPublicUrl: process.env.APP_PUBLIC_URL || 'http://localhost:3000/',
  attachmentsDir: process.env.ATTACHMENTS_DIR || path.join(appRoot, 'data', 'attachments'),
  cookieSecret: process.env.COOKIE_SECRET || 'dev-secret-change-me',
  databasePath: process.env.DATABASE_PATH || path.join(appRoot, 'data', 'diario.sqlite'),
  host: process.env.HOST || '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  mail: {
    enabled: process.env.MAIL_ENABLED === 'true',
    from: process.env.MAIL_FROM || 'diario@localhost',
    to: process.env.MAIL_TO || 'you@example.com',
    smtpHost: process.env.SMTP_HOST || 'host.docker.internal',
    smtpPass: process.env.SMTP_PASS || '',
    smtpPort: Number.parseInt(process.env.SMTP_PORT || '25', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpTlsServername: process.env.SMTP_TLS_SERVERNAME || '',
    smtpUser: process.env.SMTP_USER || '',
    streakCheckHour: Number.parseInt(process.env.STREAK_CHECK_HOUR || '20', 10)
  },
  port: Number.parseInt(process.env.PORT || '3000', 10),
  publicDir: path.join(appRoot, 'public'),
  viewsDir: path.join(appRoot, 'views')
};
