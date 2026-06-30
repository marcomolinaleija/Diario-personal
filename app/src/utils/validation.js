const MAX_TITLE_LENGTH = 160;
const MAX_BODY_LENGTH = 50000;
const MAX_TAGS_LENGTH = 300;

export function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function normalizeEntryInput(input) {
  const title = String(input.title || '').trim();
  const body = String(input.body || '').trim();
  const tags = optionalText(input.tags, MAX_TAGS_LENGTH);
  const entryDate = String(input.entryDate || input.entry_date || '').trim();
  const entryTime = normalizeTime(input.entryTime || input.entry_time);
  const writingStartedAt = normalizeDateTime(input.writingStartedAt || input.writing_started_at);
  const writingEndedAt = normalizeDateTime(input.writingEndedAt || input.writing_ended_at);
  const errors = {};

  if (!title) errors.title = 'Escribe un título.';
  if (title.length > MAX_TITLE_LENGTH) errors.title = `Usa ${MAX_TITLE_LENGTH} caracteres o menos.`;

  if (!body) errors.body = 'Escribe el contenido de la entrada.';
  if (body.length > MAX_BODY_LENGTH) errors.body = `Usa ${MAX_BODY_LENGTH} caracteres o menos.`;

  if (!entryDate) errors.entryDate = 'Elige la fecha de la entrada.';
  if (entryDate && !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    errors.entryDate = 'Usa una fecha válida.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      values: { title, body, tags, entryDate, entryTime, writingStartedAt, writingEndedAt }
    };
  }

  return {
    ok: true,
    value: {
      title,
      body,
      mood: null,
      tags,
      entryDate,
      entryTime,
      writingStartedAt,
      writingEndedAt
    }
  };
}

function optionalText(value, maxLength) {
  const text = String(value || '').trim();
  return text.slice(0, maxLength) || null;
}

function normalizeTime(value) {
  const text = String(value || '').trim();
  return /^\d{2}:\d{2}$/.test(text) ? text : null;
}

function normalizeDateTime(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) ? text.slice(0, 16) : null;
}
