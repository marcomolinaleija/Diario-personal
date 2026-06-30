import fs from 'node:fs';
import { createAttachmentsService } from '../services/attachments-service.js';

export async function registerAttachmentsRoutes(app) {
  const attachments = createAttachmentsService();

  app.post('/entries/:id/attachments', async (request, reply) => {
    const file = await request.file();
    const result = await attachments.createAttachment(request.params.id, file);

    if (!result.ok) {
      return reply.redirect(`/entries/${request.params.id}?attachmentError=${encodeURIComponent(result.error)}`);
    }

    return reply.redirect(`/entries/${request.params.id}`);
  });

  app.post('/attachments/:id/delete', async (request, reply) => {
    const attachment = attachments.getAttachment(request.params.id);
    if (!attachment) return reply.callNotFound();

    await attachments.deleteAttachment(attachment.id);
    return reply.redirect(`/entries/${attachment.entry_id}`);
  });

  app.get('/attachments/:id/download', async (request, reply) => {
    const attachment = attachments.getAttachment(request.params.id);
    if (!attachment) return reply.callNotFound();

    return reply
      .header('Content-Type', attachment.mime_type)
      .header('Content-Disposition', `attachment; filename="${encodeFilename(attachment.original_name)}"`)
      .send(fs.createReadStream(attachments.pathForAttachment(attachment)));
  });

  app.get('/attachments/:id/view', async (request, reply) => {
    const attachment = attachments.getAttachment(request.params.id);
    if (!attachment) return reply.callNotFound();

    return reply
      .header('Content-Type', attachment.mime_type)
      .header('Content-Disposition', `inline; filename="${encodeFilename(attachment.original_name)}"`)
      .send(fs.createReadStream(attachments.pathForAttachment(attachment)));
  });
}

function encodeFilename(filename) {
  return String(filename || 'attachment').replace(/"/g, '');
}
