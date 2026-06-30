import { createExportService } from '../services/export-service.js';
import { entriesToJson, entriesToMarkdown, entriesToZip, safeFilename, zipFilenameForEntry } from '../utils/export-format.js';

export async function registerExportRoutes(app) {
  const exportService = createExportService();

  app.get('/entries/:id/export.md', async (request, reply) => {
    const entry = exportService.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToMarkdown([entry], entry.title),
      contentType: 'text/markdown; charset=utf-8',
      filename: `${entry.entry_date}-${safeFilename(entry.title)}.md`
    });
  });

  app.get('/entries/:id/export.json', async (request, reply) => {
    const entry = exportService.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToJson([entry], entry.title),
      contentType: 'application/json; charset=utf-8',
      filename: `${entry.entry_date}-${safeFilename(entry.title)}.json`
    });
  });

  app.get('/entries/:id/export.zip', async (request, reply) => {
    const entry = exportService.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return sendDownload(reply, {
      body: await entriesToZip([entry], entry.title),
      contentType: 'application/zip',
      filename: zipFilenameForEntry(entry)
    });
  });

  app.get('/export/diario.md', async (_request, reply) => {
    const entries = exportService.getAllEntries();
    return sendDownload(reply, {
      body: entriesToMarkdown(entries, 'Diario Personal'),
      contentType: 'text/markdown; charset=utf-8',
      filename: 'diario-completo.md'
    });
  });

  app.get('/export/diario.json', async (_request, reply) => {
    const entries = exportService.getAllEntries();
    return sendDownload(reply, {
      body: entriesToJson(entries, 'Diario Personal'),
      contentType: 'application/json; charset=utf-8',
      filename: 'diario-completo.json'
    });
  });

  app.get('/export/diario.zip', async (_request, reply) => {
    const entries = exportService.getAllEntries();
    return sendDownload(reply, {
      body: await entriesToZip(entries, 'Diario Personal'),
      contentType: 'application/zip',
      filename: 'diario-completo.zip'
    });
  });

  app.get('/export/:year/diario.md', async (request, reply) => {
    const entries = exportService.getEntriesByYear(request.params.year);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToMarkdown(entries, `Diario ${request.params.year}`),
      contentType: 'text/markdown; charset=utf-8',
      filename: `diario-${request.params.year}.md`
    });
  });

  app.get('/export/:year/diario.json', async (request, reply) => {
    const entries = exportService.getEntriesByYear(request.params.year);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToJson(entries, `Diario ${request.params.year}`),
      contentType: 'application/json; charset=utf-8',
      filename: `diario-${request.params.year}.json`
    });
  });

  app.get('/export/:year/diario.zip', async (request, reply) => {
    const entries = exportService.getEntriesByYear(request.params.year);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: await entriesToZip(entries, `Diario ${request.params.year}`),
      contentType: 'application/zip',
      filename: `diario-${request.params.year}.zip`
    });
  });

  app.get('/export/:year/:month/diario.md', async (request, reply) => {
    const month = String(request.params.month).padStart(2, '0');
    const entries = exportService.getEntriesByMonth(request.params.year, month);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToMarkdown(entries, `Diario ${request.params.year}-${month}`),
      contentType: 'text/markdown; charset=utf-8',
      filename: `diario-${request.params.year}-${month}.md`
    });
  });

  app.get('/export/:year/:month/diario.json', async (request, reply) => {
    const month = String(request.params.month).padStart(2, '0');
    const entries = exportService.getEntriesByMonth(request.params.year, month);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: entriesToJson(entries, `Diario ${request.params.year}-${month}`),
      contentType: 'application/json; charset=utf-8',
      filename: `diario-${request.params.year}-${month}.json`
    });
  });

  app.get('/export/:year/:month/diario.zip', async (request, reply) => {
    const month = String(request.params.month).padStart(2, '0');
    const entries = exportService.getEntriesByMonth(request.params.year, month);
    if (!entries) return reply.callNotFound();

    return sendDownload(reply, {
      body: await entriesToZip(entries, `Diario ${request.params.year}-${month}`),
      contentType: 'application/zip',
      filename: `diario-${request.params.year}-${month}.zip`
    });
  });
}

function sendDownload(reply, { body, contentType, filename }) {
  return reply
    .header('Content-Type', contentType)
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(body);
}
