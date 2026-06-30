CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  mood TEXT,
  tags TEXT,
  entry_date TEXT NOT NULL,
  entry_time TEXT,
  writing_started_at TEXT,
  writing_ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON attachments(entry_id);

CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_key TEXT NOT NULL,
  notification_date TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  UNIQUE (scenario_key, notification_date)
);
