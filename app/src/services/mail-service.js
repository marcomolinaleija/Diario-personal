import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function createMailService() {
  const auth = env.mail.smtpUser
    ? {
        user: env.mail.smtpUser,
        pass: env.mail.smtpPass
      }
    : undefined;

  const transporter = nodemailer.createTransport({
    host: env.mail.smtpHost,
    port: env.mail.smtpPort,
    secure: env.mail.smtpSecure,
    auth,
    tls: env.mail.smtpTlsServername
      ? {
          servername: env.mail.smtpTlsServername
        }
      : undefined
  });

  return {
    isEnabled() {
      return env.mail.enabled;
    },

    async send({ subject, text }) {
      if (!env.mail.enabled) {
        return { skipped: true };
      }

      return transporter.sendMail({
        from: env.mail.from,
        to: env.mail.to,
        subject,
        text
      });
    }
  };
}
