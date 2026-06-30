import { getDatabase } from '../db/connection.js';

export function createAttachmentsRepository() {
  const db = getDatabase();

  return {
    listByEntryId(entryId) {
      return db
        .prepare(`
          SELECT id, entry_id, original_name, stored_name, relative_path, mime_type, size_bytes, created_at
          FROM attachments
          WHERE entry_id = ?
          ORDER BY created_at ASC, id ASC
        `)
        .all(entryId);
    },

    findById(id) {
      return db
        .prepare(`
          SELECT id, entry_id, original_name, stored_name, relative_path, mime_type, size_bytes, created_at
          FROM attachments
          WHERE id = ?
        `)
        .get(id);
    },

    create(attachment) {
      const result = db
        .prepare(`
          INSERT INTO attachments (
            entry_id, original_name, stored_name, relative_path, mime_type, size_bytes, created_at
          )
          VALUES (
            @entryId, @originalName, @storedName, @relativePath, @mimeType, @sizeBytes, @createdAt
          )
        `)
        .run(attachment);

      return result.lastInsertRowid;
    },

    delete(id) {
      return db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
    }
  };
}
