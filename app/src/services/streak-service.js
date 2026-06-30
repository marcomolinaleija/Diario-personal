import { createEntriesRepository } from '../repositories/entries-repository.js';
import { todayForInput } from '../utils/datetime.js';

export function createStreakService() {
  const repository = createEntriesRepository();

  return {
    getStreakSummary(referenceDate = todayForInput()) {
      const dates = repository.listEntryDates().map((row) => row.date);
      return calculateStreakSummary(dates, referenceDate);
    }
  };
}

export function calculateStreakSummary(dates, referenceDate = todayForInput()) {
  const uniqueDates = [...new Set(dates)].sort();
  const dateSet = new Set(uniqueDates);
  const today = referenceDate;
  const yesterday = addDays(today, -1);
  const wroteToday = dateSet.has(today);
  const lastEntryDate = uniqueDates.at(-1) || null;
  const daysSinceLastEntry = lastEntryDate ? daysBetween(lastEntryDate, today) : null;
  const activeAnchor = wroteToday ? today : yesterday;

  return {
    activeStreak: countBackward(dateSet, activeAnchor),
    currentStreak: wroteToday ? countBackward(dateSet, today) : 0,
    daysSinceLastEntry,
    daysWrittenLast7: countDaysSince(dateSet, today, 7),
    daysWrittenLast30: countDaysSince(dateSet, today, 30),
    lastEntryDate,
    longestStreak: longestStreak(uniqueDates),
    previousGapBeforeToday: previousGapBeforeToday(uniqueDates, today),
    totalWritingDays: uniqueDates.length,
    wroteToday,
    today,
    yesterday
  };
}

function countBackward(dateSet, startDate) {
  let count = 0;
  let cursor = startDate;

  while (dateSet.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }

  return count;
}

function longestStreak(dates) {
  let longest = 0;
  let current = 0;
  let previous = null;

  dates.forEach((date) => {
    if (!previous || daysBetween(previous, date) === 1) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previous = date;
  });

  return longest;
}

function countDaysSince(dateSet, today, windowSize) {
  let count = 0;

  for (let offset = 0; offset < windowSize; offset += 1) {
    if (dateSet.has(addDays(today, -offset))) {
      count += 1;
    }
  }

  return count;
}

function previousGapBeforeToday(dates, today) {
  if (!dates.includes(today)) return null;
  const previousDates = dates.filter((date) => date < today);
  const previous = previousDates.at(-1);
  if (!previous) return null;
  return daysBetween(previous, today) - 1;
}

export function addDays(date, offset) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return parsed.toISOString().slice(0, 10);
}

export function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / 86400000);
}
