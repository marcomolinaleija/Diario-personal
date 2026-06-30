import crypto from 'node:crypto';
import fp from 'fastify-plugin';

const COOKIE_NAME = 'diario_csrf';

function csrfPluginInternal(fastify, _options, done) {
  fastify.decorateReply('ensureCsrfToken', function ensureCsrfToken() {
    let token = this.request.cookies[COOKIE_NAME];

    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      this.setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: fastify.config.IS_PRODUCTION
      });
    }

    return token;
  });

  fastify.addHook('preHandler', async (request, reply) => {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return;
    }

    const cookieToken = request.cookies[COOKIE_NAME];
    const bodyToken = request.body?._csrf || request.query?._csrf;

    if (!cookieToken || !bodyToken || cookieToken !== bodyToken) {
      return reply.code(403).view('errors/403.ejs', {
        title: 'Acceso no permitido',
        csrfToken: reply.ensureCsrfToken()
      });
    }
  });

  done();
}

export const csrfPlugin = fp(csrfPluginInternal, {
  name: 'diario-csrf'
});
