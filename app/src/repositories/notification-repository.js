import { getDatabase } from '../db/connection.js';

export function createNotificationRepository() {
  const db = getDatabase();

  return {
    hasSent(scenarioKey, notificationDate) {
      const row = db
        .prepare(`
          SELECT id
          FROM notification_log
          WHERE scenario_key = @scenarioKey
            AND notification_date = @notificationDate
        `)
        .get({ scenarioKey, notificationDate });

      return Boolean(row);
    },

    markSent(scenarioKey, notificationDate) {
      db
        .prepare(`
          INSERT OR IGNORE INTO notification_log (scenario_key, notification_date, sent_at)
          VALUES (@scenarioKey, @notificationDate, @sentAt)
        `)
        .run({
          scenarioKey,
          notificationDate,
          sentAt: new Date().toISOString()
        });
    }
  };
}
