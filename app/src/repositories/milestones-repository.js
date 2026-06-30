import { getDatabase } from '../db/connection.js';

export function createMilestonesRepository() {
  const db = getDatabase();

  return {
    listAll() {
      return db
        .prepare(`
          SELECT id, entry_id, title, description, milestone_date, created_at
          FROM milestones
          ORDER BY milestone_date DESC, created_at DESC
        `)
        .all();
    },

    listPaginated({ limit, offset } = {}) {
      return db
        .prepare(`
          SELECT id, entry_id, title, description, milestone_date, created_at
          FROM milestones
          ORDER BY milestone_date DESC, created_at DESC
          LIMIT @limit OFFSET @offset
        `)
        .all({ limit, offset });
    },

    count() {
      const row = db.prepare('SELECT COUNT(*) AS total FROM milestones').get();
      return row.total;
    },

    listByEntryId(entryId) {
      return db
        .prepare(`
          SELECT id, entry_id, title, description, milestone_date, created_at
          FROM milestones
          WHERE entry_id = ?
          ORDER BY created_at DESC
        `)
        .all(entryId);
    },

    listByDate(date) {
      return db
        .prepare(`
          SELECT id, entry_id, title, description, milestone_date, created_at
          FROM milestones
          WHERE milestone_date = ?
          ORDER BY created_at DESC
        `)
        .all(date);
    },

    calendarMonth(year, month) {
      return db
        .prepare(`
          SELECT milestone_date AS date, COUNT(*) AS totalMilestones
          FROM milestones
          WHERE substr(milestone_date, 1, 4) = @year
            AND substr(milestone_date, 6, 2) = @month
          GROUP BY milestone_date
          ORDER BY milestone_date ASC
        `)
        .all({ year, month });
    },

    findById(id) {
      return db
        .prepare(`
          SELECT id, entry_id, title, description, milestone_date, created_at
          FROM milestones
          WHERE id = ?
        `)
        .get(id);
    },

    create(milestone) {
      const result = db
        .prepare(`
          INSERT INTO milestones (entry_id, title, description, milestone_date, created_at)
          VALUES (@entryId, @title, @description, @milestoneDate, @createdAt)
        `)
        .run(milestone);

      return result.lastInsertRowid;
    },

    delete(id) {
      return db.prepare('DELETE FROM milestones WHERE id = ?').run(id);
    }
  };
}
