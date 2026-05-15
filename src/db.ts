import Database from "better-sqlite3";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(":memory:");
    initSchema(_db);
    seed(_db);
  }
  return _db;
}

export function resetDb(): Database.Database {
  _db = null;
  return getDb();
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT NOT NULL,
      email        TEXT NOT NULL,
      role         TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      api_key      TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS pages (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      slug         TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '',
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      created_by   TEXT NOT NULL REFERENCES users(id),
      published    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seed(db: Database.Database) {
  db.exec(`
    INSERT OR IGNORE INTO workspaces VALUES ('ws-alpha', 'Alpha Corp');
    INSERT OR IGNORE INTO workspaces VALUES ('ws-beta',  'Beta LLC');

    INSERT OR IGNORE INTO users VALUES
      ('u-alice', 'alice', 'alice@alpha.com', 'admin',  'ws-alpha', 'key-alice');
    INSERT OR IGNORE INTO users VALUES
      ('u-carol', 'carol', 'carol@alpha.com', 'editor', 'ws-alpha', 'key-carol');
    INSERT OR IGNORE INTO users VALUES
      ('u-frank', 'frank', 'frank@alpha.com', 'viewer', 'ws-alpha', 'key-frank');
    INSERT OR IGNORE INTO users VALUES
      ('u-bob',   'bob',   'bob@beta.com',    'admin',  'ws-beta',  'key-bob');

    INSERT OR IGNORE INTO pages VALUES
      ('pg-001', 'Getting Started', 'getting-started', '<h1>Welcome</h1><p>Get started here.</p>', 'ws-alpha', 'u-alice', 1, '2024-03-01 09:00:00');
    INSERT OR IGNORE INTO pages VALUES
      ('pg-002', 'API Reference',   'api-reference',   '<h1>API Docs</h1><p>Endpoints listed below.</p>', 'ws-alpha', 'u-carol', 1, '2024-03-02 10:00:00');
    INSERT OR IGNORE INTO pages VALUES
      ('pg-003', 'Internal Notes',  'internal-notes',  '<h1>Notes</h1><p>Draft content.</p>', 'ws-alpha', 'u-alice', 0, '2024-03-03 11:00:00');
    INSERT OR IGNORE INTO pages VALUES
      ('pg-004', 'Beta Welcome',    'beta-welcome',    '<h1>Beta</h1><p>Welcome to Beta.</p>', 'ws-beta', 'u-bob', 1, '2024-03-01 08:00:00');
  `);
}
