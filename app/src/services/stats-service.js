import { createEntriesRepository } from '../repositories/entries-repository.js';
import { env } from '../config/env.js';
import { NOTIFICATION_SCENARIOS } from './streak-notification-service.js';
import { createStreakService } from './streak-service.js';

export function createStatsService() {
  const repository = createEntriesRepository();
  const streakService = createStreakService();

  return {
    getStats() {
      const stats = repository.getStats();
      return {
        overview: {
          ...stats.overview,
          totalWords: estimateWords(stats.overview.totalCharacters)
        },
        byYear: stats.byYear.map(withEstimatedWords),
        byMonth: stats.byMonth.map(withEstimatedWords),
        streak: streakService.getStreakSummary(),
        notifications: {
          enabled: env.mail.enabled,
          recipient: env.mail.to,
          checkHour: env.mail.streakCheckHour,
          scenarios: NOTIFICATION_SCENARIOS
        }
      };
    }
  };
}

function withEstimatedWords(row) {
  return {
    ...row,
    totalWords: estimateWords(row.totalCharacters)
  };
}

function estimateWords(characters) {
  return Math.round(Number(characters || 0) / 5);
}
