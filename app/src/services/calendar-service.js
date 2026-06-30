import { createEntriesRepository } from '../repositories/entries-repository.js';
import { createMilestonesRepository } from '../repositories/milestones-repository.js';
import { todayForInput } from '../utils/datetime.js';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];

export function createCalendarService() {
  const repository = createEntriesRepository();
  const milestones = createMilestonesRepository();

  return {
    getMonth(yearInput, monthInput) {
      const fallback = todayForInput();
      const year = normalizeYear(yearInput) || fallback.slice(0, 4);
      const month = normalizeMonth(monthInput) || fallback.slice(5, 7);
      const rows = repository.calendarMonth(year, month);
      const milestoneRows = milestones.calendarMonth(year, month);
      const countsByDate = Object.fromEntries(rows.map((row) => [row.date, row.totalEntries]));
      const milestoneCountsByDate = Object.fromEntries(milestoneRows.map((row) => [row.date, row.totalMilestones]));

      return buildMonth(year, month, countsByDate, milestoneCountsByDate);
    },

    getDay(date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return null;
      return {
        date,
        entries: repository.listByDate(date),
        milestones: milestones.listByDate(date)
      };
    }
  };
}

function buildMonth(year, month, countsByDate, milestoneCountsByDate) {
  const monthIndex = Number(month) - 1;
  const first = new Date(Date.UTC(Number(year), monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(Number(year), monthIndex + 1, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < leadingBlanks; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
    days.push({
      day,
      date,
      totalEntries: countsByDate[date] || 0,
      totalMilestones: milestoneCountsByDate[date] || 0
    });
  }

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return {
    year,
    month,
    monthName: MONTH_NAMES[monthIndex],
    days,
    previous,
    next
  };
}

function shiftMonth(year, month, offset) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1 + offset, 1));
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0')
  };
}

function normalizeYear(value) {
  const text = String(value || '');
  return /^\d{4}$/.test(text) ? text : null;
}

function normalizeMonth(value) {
  const text = String(value || '').padStart(2, '0');
  return /^(0[1-9]|1[0-2])$/.test(text) ? text : null;
}
