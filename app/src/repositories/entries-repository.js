import { getDatabase } from '../db/connection.js';

const listSql = `
  SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
  FROM entries
  WHERE
    @query IS NULL
    OR title LIKE @likeQuery
    OR body LIKE @likeQuery
    OR tags LIKE @likeQuery
  ORDER BY entry_date DESC, updated_at DESC
`;

const filteredEntriesWhereSql = `
  WHERE
    @query IS NULL
    OR title LIKE @likeQuery
    OR body LIKE @likeQuery
    OR tags LIKE @likeQuery
`;

export function createEntriesRepository() {
  const db = getDatabase();

  return {
    list({ query = '' } = {}) {
      const normalizedQuery = query.trim();
      return db.prepare(listSql).all({
        query: normalizedQuery || null,
        likeQuery: `%${normalizedQuery}%`
      });
    },

    listPaginated({ query = '', limit, offset } = {}) {
      const normalizedQuery = query.trim();
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          ${filteredEntriesWhereSql}
          ORDER BY entry_date DESC, updated_at DESC
          LIMIT @limit OFFSET @offset
        `)
        .all({
          query: normalizedQuery || null,
          likeQuery: `%${normalizedQuery}%`,
          limit,
          offset
        });
    },

    count({ query = '' } = {}) {
      const normalizedQuery = query.trim();
      const row = db
        .prepare(`
          SELECT COUNT(*) AS total
          FROM entries
          ${filteredEntriesWhereSql}
        `)
        .get({
          query: normalizedQuery || null,
          likeQuery: `%${normalizedQuery}%`
        });

      return row.total;
    },

    findById(id) {
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          WHERE id = ?
        `)
        .get(id);
    },

    listAll() {
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          ORDER BY entry_date ASC, entry_time ASC, id ASC
        `)
        .all();
    },

    listByYear(year) {
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          WHERE substr(entry_date, 1, 4) = @year
          ORDER BY entry_date ASC, entry_time ASC, id ASC
        `)
        .all({ year });
    },

    listByMonth(year, month) {
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          WHERE substr(entry_date, 1, 4) = @year
            AND substr(entry_date, 6, 2) = @month
          ORDER BY entry_date ASC, entry_time ASC, id ASC
        `)
        .all({ year, month });
    },

    listByDate(date) {
      return db
        .prepare(`
          SELECT id, title, body, mood, tags, entry_date, entry_time, writing_started_at, writing_ended_at, created_at, updated_at
          FROM entries
          WHERE entry_date = @date
          ORDER BY entry_time ASC, id ASC
        `)
        .all({ date });
    },

    calendarMonth(year, month) {
      return db
        .prepare(`
          SELECT
            entry_date AS date,
            COUNT(*) AS totalEntries
          FROM entries
          WHERE substr(entry_date, 1, 4) = @year
            AND substr(entry_date, 6, 2) = @month
          GROUP BY entry_date
          ORDER BY entry_date ASC
        `)
        .all({ year, month });
    },

    listEntryDates() {
      return db
        .prepare(`
          SELECT DISTINCT entry_date AS date
          FROM entries
          ORDER BY entry_date ASC
        `)
        .all();
    },

    getStats() {
      const overview = db
        .prepare(`
          SELECT
            COUNT(*) AS totalEntries,
            COALESCE(SUM(length(body)), 0) AS totalCharacters,
            MIN(entry_date) AS firstEntryDate,
            MAX(entry_date) AS lastEntryDate
          FROM entries
        `)
        .get();

      const byYear = db
        .prepare(`
          SELECT
            substr(entry_date, 1, 4) AS year,
            COUNT(*) AS totalEntries,
            COALESCE(SUM(length(body)), 0) AS totalCharacters
          FROM entries
          GROUP BY year
          ORDER BY year DESC
        `)
        .all();

      const byMonth = db
        .prepare(`
          SELECT
            substr(entry_date, 1, 4) AS year,
            substr(entry_date, 6, 2) AS month,
            COUNT(*) AS totalEntries,
            COALESCE(SUM(length(body)), 0) AS totalCharacters
          FROM entries
          GROUP BY year, month
          ORDER BY year DESC, month DESC
        `)
        .all();

      return { overview, byYear, byMonth };
    },

    create(entry) {
      const result = db
        .prepare(`
          INSERT INTO entries (
            title, body, mood, tags, entry_date, entry_time,
            writing_started_at, writing_ended_at, created_at, updated_at
          )
          VALUES (
            @title, @body, @mood, @tags, @entryDate, @entryTime,
            @writingStartedAt, @writingEndedAt, @now, @now
          )
        `)
        .run(entry);

      return result.lastInsertRowid;
    },

    update(id, entry) {
      return db
        .prepare(`
          UPDATE entries
          SET title = @title,
              body = @body,
              mood = @mood,
              tags = @tags,
              entry_date = @entryDate,
              entry_time = @entryTime,
              writing_started_at = @writingStartedAt,
              writing_ended_at = @writingEndedAt,
              updated_at = @now
          WHERE id = @id
        `)
        .run({ ...entry, id });
    },

    delete(id) {
      return db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    }
  };
}
