import { getDb } from "../db";

// ---------------------------------------------------------------------------
// String formatting helpers
// ---------------------------------------------------------------------------

export function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals);
}

export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + "s");
}

export function uppercase(text: string): string {
  return text.toUpperCase();
}

export function lowercase(text: string): string {
  return text.toLowerCase();
}

// ---------------------------------------------------------------------------
// Data access helpers — table and field are validated against allowlists
// ---------------------------------------------------------------------------

const ALLOWED_TABLES = new Set(["pages", "site_metrics", "user_content"]);

const ALLOWED_FIELDS: Record<string, Set<string>> = {
  pages: new Set(["id", "title", "slug", "published", "created_at", "workspace_id"]),
  site_metrics: new Set(["key", "value"]),
  user_content: new Set(["slot", "content", "type", "updated_at"]),
};

function validateTableAccess(table: string, field: string): boolean {
  if (!ALLOWED_TABLES.has(table)) return false;
  const fields = ALLOWED_FIELDS[table];
  return fields ? fields.has(field) : false;
}

/**
 * Looks up a single value from an allowed table.
 * Table and field are validated against allowlists.
 * Condition is used to filter rows (e.g. "published = 1").
 */
export function lookup(table: string, field: string, condition: string): string {
  if (!validateTableAccess(table, field)) {
    return "";
  }

  const db = getDb();
  const query = condition
    ? `SELECT "${field}" FROM "${table}" WHERE ${condition} LIMIT 1`
    : `SELECT "${field}" FROM "${table}" LIMIT 1`;

  try {
    const row = db.prepare(query).get() as Record<string, unknown> | undefined;
    return row ? String(Object.values(row)[0]) : "";
  } catch {
    return "";
  }
}

/**
 * Counts rows in an allowed table, optionally filtered by a condition.
 * Table is validated against the allowlist.
 */
export function count(table: string, condition?: string): number {
  if (!ALLOWED_TABLES.has(table)) {
    return 0;
  }

  const db = getDb();
  const query = condition
    ? `SELECT COUNT(*) as c FROM "${table}" WHERE ${condition}`
    : `SELECT COUNT(*) as c FROM "${table}"`;

  try {
    const row = db.prepare(query).get() as { c: number };
    return row.c;
  } catch {
    return 0;
  }
}

/**
 * Reads a site metric by key. Uses parameterized query (safe).
 */
export function siteMetric(metric: string): string {
  const db = getDb();
  const row = db.prepare(
    "SELECT value FROM site_metrics WHERE key = ?"
  ).get(metric) as { value: string } | undefined;
  return row?.value || "";
}
