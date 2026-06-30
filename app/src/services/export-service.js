import { createEntriesRepository } from '../repositories/entries-repository.js';
import { parseId } from '../utils/validation.js';

export function createExportService() {
  const repository = createEntriesRepository();

  return {
    getEntry(id) {
      const parsedId = parseId(id);
      if (!parsedId) return null;
      return repository.findById(parsedId);
    },

    getAllEntries() {
      return repository.listAll();
    },

    getEntriesByYear(year) {
      if (!/^\d{4}$/.test(String(year || ''))) return null;
      return repository.listByYear(String(year));
    },

    getEntriesByMonth(year, month) {
      const normalizedMonth = String(month || '').padStart(2, '0');
      if (!/^\d{4}$/.test(String(year || '')) || !/^(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
        return null;
      }

      return repository.listByMonth(String(year), normalizedMonth);
    }
  };
}
