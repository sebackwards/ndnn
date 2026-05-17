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

    CREATE TABLE IF NOT EXISTS user_content (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      slot       TEXT NOT NULL,
      content    TEXT NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('template', 'setting')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, slot)
    );

    CREATE TABLE IF NOT EXISTS layouts (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      slug         TEXT NOT NULL,
      content      TEXT NOT NULL,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      created_by   TEXT NOT NULL REFERENCES users(id),
      is_system    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, slug)
    );

    CREATE TABLE IF NOT EXISTS site_metrics (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
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

    INSERT OR IGNORE INTO user_content (user_id, slot, content, type, updated_at) VALUES
      ('u-alice', 'error-page', '<h1>404 - Page Not Found</h1><p>Sorry, the page you requested could not be found.</p><p>— {{companyName}} ({{year}})</p>', 'template', '2024-03-01 09:00:00');
    INSERT OR IGNORE INTO user_content (user_id, slot, content, type, updated_at) VALUES
      ('u-carol', 'greeting', '<p>Welcome back! Contact us at {{supportEmail}}</p>', 'template', '2024-03-02 10:00:00');

    -- System layout (admin-created, uses data helpers)
    INSERT OR IGNORE INTO layouts VALUES
      ('lay-001', 'Standard Export', 'standard', '<html><body><h1>{{page.title}}</h1><div>{{page.content}}</div><footer>Exported on {{helpers.formatDate(exportDate)}} | Pages: {{helpers.count(''pages'')}}</footer></body></html>', 'ws-alpha', 'u-alice', 1, '2024-03-01 09:00:00');

    -- User layout (editor-created, should only use formatting helpers)
    INSERT OR IGNORE INTO layouts VALUES
      ('lay-002', 'Simple Export', 'simple', '<html><body><h1>{{helpers.uppercase(page.title)}}</h1><div>{{page.content}}</div></body></html>', 'ws-alpha', 'u-carol', 0, '2024-03-02 10:00:00');

    INSERT OR IGNORE INTO layouts VALUES
      ('lay-003', 'Beta Standard', 'beta-standard', '<html><body><h1>{{page.title}}</h1><p>{{page.content}}</p></body></html>', 'ws-beta', 'u-bob', 1, '2024-03-01 08:00:00');

    INSERT OR IGNORE INTO site_metrics VALUES ('total_pages', '4');
    INSERT OR IGNORE INTO site_metrics VALUES ('active_users', '4');
    INSERT OR IGNORE INTO site_metrics VALUES ('version', '1.0.0');
  `);
}
