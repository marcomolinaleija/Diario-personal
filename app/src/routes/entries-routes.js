import { createEntriesService } from '../services/entries-service.js';
import { createAttachmentsService } from '../services/attachments-service.js';
import { timeForInput, todayForInput } from '../utils/datetime.js';
import { baseViewData } from '../utils/view-data.js';

export async function registerEntriesRoutes(app) {
  const entries = createEntriesService();
  const attachments = createAttachmentsService();

  app.get('/', async (request, reply) => {
    const query = String(request.query.q || '').trim();
    return reply.view('entries/list.ejs', baseViewData(reply, {
      title: 'Entradas',
      entries: entries.listEntries({ query }),
      query
    }));
  });

  app.get('/entries/new', async (_request, reply) => {
    return reply.view('entries/form.ejs', baseViewData(reply, {
      title: 'Nueva entrada',
      mode: 'create',
      action: '/entries',
      values: defaultValues(),
      errors: {}
    }));
  });

  app.post('/entries', async (request, reply) => {
    const result = entries.createEntry(request.body);

    if (!result.ok) {
      return reply.code(422).view('entries/form.ejs', baseViewData(reply, {
        title: 'Nueva entrada',
        mode: 'create',
        action: '/entries',
        values: result.values,
        errors: result.errors
      }));
    }

    return reply.redirect(`/entries/${result.id}`);
  });

  app.get('/entries/:id', async (request, reply) => {
    const entry = entries.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return reply.view('entries/detail.ejs', baseViewData(reply, {
      title: entry.title,
      entry,
      attachments: attachments.listForEntry(entry.id),
      attachmentError: request.query.attachmentError || ''
    }));
  });

  app.get('/entries/:id/edit', async (request, reply) => {
    const entry = entries.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return reply.view('entries/form.ejs', baseViewData(reply, {
      title: 'Editar entrada',
      mode: 'edit',
      action: `/entries/${entry.id}`,
      values: toFormValues(entry),
      errors: {}
    }));
  });

  app.post('/entries/:id', async (request, reply) => {
    const result = entries.updateEntry(request.params.id, request.body);

    if (!result.ok) {
      return reply.code(422).view('entries/form.ejs', baseViewData(reply, {
        title: 'Editar entrada',
        mode: 'edit',
        action: `/entries/${request.params.id}`,
        values: result.values || defaultValues(),
        errors: result.errors
      }));
    }

    return reply.redirect(`/entries/${result.id}`);
  });

  app.get('/entries/:id/delete', async (request, reply) => {
    const entry = entries.getEntry(request.params.id);
    if (!entry) return reply.callNotFound();

    return reply.view('entries/delete.ejs', baseViewData(reply, {
      title: 'Eliminar entrada',
      entry
    }));
  });

  app.post('/entries/:id/delete', async (request, reply) => {
    await attachments.deleteForEntry(request.params.id);
    entries.deleteEntry(request.params.id);
    return reply.redirect('/');
  });
}

function defaultValues() {
  return {
    title: '',
    body: '',
    tags: '',
    entryDate: todayForInput(),
    entryTime: timeForInput(),
    writingStartedAt: '',
    writingEndedAt: ''
  };
}

function toFormValues(entry) {
  return {
    title: entry.title,
    body: entry.body,
    tags: entry.tags || '',
    entryDate: entry.entry_date,
    entryTime: entry.entry_time || '',
    writingStartedAt: entry.writing_started_at || '',
    writingEndedAt: entry.writing_ended_at || ''
  };
}
