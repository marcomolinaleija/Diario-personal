import { createEntriesRepository } from '../repositories/entries-repository.js';
import { toLocalInputDateTime } from '../utils/datetime.js';
import { normalizeEntryInput, parseId } from '../utils/validation.js';

export function createEntriesService() {
  const repository = createEntriesRepository();

  return {
    listEntries(filters) {
      return repository.list(filters);
    },

    listEntriesPage(filters) {
      return {
        entries: repository.listPaginated(filters),
        totalItems: repository.count(filters)
      };
    },

    getEntry(id) {
      const parsedId = parseId(id);
      if (!parsedId) return null;
      return repository.findById(parsedId);
    },

    createEntry(input) {
      const normalized = normalizeEntryInput(input);
      if (!normalized.ok) return normalized;

      const id = repository.create({
        ...withFallbackTimes(normalized.value),
        now: new Date().toISOString()
      });

      return { ok: true, id };
    },

    updateEntry(id, input) {
      const parsedId = parseId(id);
      if (!parsedId) return { ok: false, errors: { form: 'La entrada no existe.' } };

      const normalized = normalizeEntryInput(input);
      if (!normalized.ok) return normalized;

      const result = repository.update(parsedId, {
        ...withFallbackTimes(normalized.value),
        now: new Date().toISOString()
      });

      if (result.changes === 0) {
        return { ok: false, errors: { form: 'La entrada no existe.' } };
      }

      return { ok: true, id: parsedId };
    },

    deleteEntry(id) {
      const parsedId = parseId(id);
      if (!parsedId) return false;
      return repository.delete(parsedId).changes > 0;
    }
  };
}

function withFallbackTimes(entry) {
  const now = new Date();
  const localNow = toLocalInputDateTime(now);

  return {
    ...entry,
    entryTime: entry.entryTime || localNow.slice(11, 16),
    writingStartedAt: entry.writingStartedAt || localNow,
    writingEndedAt: entry.writingEndedAt || localNow
  };
}
