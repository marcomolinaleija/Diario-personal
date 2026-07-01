import { createMailService } from '../services/mail-service.js';

const labels = {
  failure: 'falló',
  success: 'se completó'
};

function formatBytes(value) {
  const bytes = Number.parseInt(value || '0', 10);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'no disponible';
  }

  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function buildMessage(env) {
  const status = env.BACKUP_STATUS === 'failure' ? 'failure' : 'success';
  const statusText = labels[status];
  const title = `Backup del diario: ${statusText}`;
  const lines = [
    title,
    '',
    `Inicio: ${env.BACKUP_STARTED_AT || 'no disponible'}`,
    `Fin: ${env.BACKUP_FINISHED_AT || 'no disponible'}`,
    `Archivo local: ${env.BACKUP_ARCHIVE_PATH || 'no disponible'}`,
    `Destino remoto: ${env.BACKUP_REMOTE_PATH || 'no disponible'}`,
    `Tamano: ${formatBytes(env.BACKUP_SIZE_BYTES)}`,
    `Retencion local: ${env.BACKUP_LOCAL_RETENTION_DAYS || 'no disponible'} dias`
  ];

  if (status === 'failure') {
    lines.push('');
    lines.push(`Codigo de salida: ${env.BACKUP_EXIT_CODE || 'no disponible'}`);
    lines.push(`Linea aproximada: ${env.BACKUP_ERROR_LINE || 'no disponible'}`);
  }

  lines.push('');
  lines.push('Este correo fue generado automaticamente por el script de backup del diario.');

  return {
    subject: title,
    text: lines.join('\n')
  };
}

async function main() {
  const mailer = createMailService();

  if (!mailer.isEnabled()) {
    console.log('Correo desactivado: MAIL_ENABLED no es true.');
    return;
  }

  const message = buildMessage(process.env);
  const result = await mailer.send(message);

  console.log(`Correo de backup enviado: ${result.messageId || 'sin messageId'}`);
}

main().catch((error) => {
  console.error('No se pudo enviar el correo de backup.');
  console.error(error);
  process.exitCode = 1;
});
