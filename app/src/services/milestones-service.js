import { createEntriesRepository } from '../repositories/entries-repository.js';
import { createMilestonesRepository } from '../repositories/milestones-repository.js';
import { parseId } from '../utils/validation.js';

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1000;

export function createMilestonesService() {
  const entries = createEntriesRepository();
  const milestones = createMilestonesRepository();

  return {
    listMilestones() {
      return milestones.listAll();
    },

    listForEntry(entryId) {
      const parsedEntryId = parseId(entryId);
      if (!parsedEntryId) return [];
      return milestones.listByEntryId(parsedEntryId);
    },

    listForDate(date) {
      if (!isValidDate(date)) return [];
      return milestones.listByDate(date);
    },

    calendarMonth(year, month) {
      return milestones.calendarMonth(year, month);
    },

    createForEntry(entryId, input) {
      const parsedEntryId = parseId(entryId);
      const entry = parsedEntryId ? entries.findById(parsedEntryId) : null;
      if (!entry) return { ok: false, error: 'La entrada no existe.' };

      const normalized = normalizeMilestoneInput({
        ...input,
        milestoneDate: input.milestoneDate || entry.entry_date
      });

      if (!normalized.ok) return normalized;

      const id = milestones.create({
        ...normalized.value,
        entryId: entry.id,
        createdAt: new Date().toISOString()
      });

      return { ok: true, id };
    },

    deleteMilestone(id) {
      const parsedId = parseId(id);
      if (!parsedId) return null;
      const milestone = milestones.findById(parsedId);
      if (!milestone) return null;
      milestones.delete(parsedId);
      return milestone;
    }
  };
}

function normalizeMilestoneInput(input) {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH) || null;
  const milestoneDate = String(input.milestoneDate || input.milestone_date || '').trim();
  const errors = {};

  if (!title) errors.title = 'Escribe un título para el hito.';
  if (title.length > MAX_TITLE_LENGTH) errors.title = `Usa ${MAX_TITLE_LENGTH} caracteres o menos.`;
  if (!isValidDate(milestoneDate)) errors.milestoneDate = 'Usa una fecha válida.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { title, description, milestoneDate }
  };
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}
