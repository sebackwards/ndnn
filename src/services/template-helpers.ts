import { getDb } from "../db";

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

export function lookup(
  table: string,
  field: string,
  conditionColumn?: string,
  conditionValue?: unknown
): string {
  if (!validateTableAccess(table, field)) {
    return "";
  }

  const db = getDb();
  let query: string;
  let params: unknown[] = [];

  if (conditionColumn && conditionValue !== undefined) {
    // Validate the condition column is in the allowed fields
    const fields = ALLOWED_FIELDS[table];
    if (!fields || !fields.has(conditionColumn)) {
      return "";
    }
    query = `SELECT "${field}" FROM "${table}" WHERE "${conditionColumn}" = ? LIMIT 1`;
    params = [conditionValue];
  } else {
    query = `SELECT "${field}" FROM "${table}" LIMIT 1`;
  }

  try {
    const row = db.prepare(query).get(...params) as Record<string, unknown> | undefined;
    return row ? String(Object.values(row)[0]) : "";
  } catch {
    return "";
  }
}

export function count(
  table: string,
  conditionColumn?: string,
  conditionValue?: unknown
): number {
  if (!ALLOWED_TABLES.has(table)) {
    return 0;
  }

  const db = getDb();
  let query: string;
  let params: unknown[] = [];

  if (conditionColumn && conditionValue !== undefined) {
    const fields = ALLOWED_FIELDS[table];
    if (!fields || !fields.has(conditionColumn)) {
      return 0;
    }
    query = `SELECT COUNT(*) as c FROM "${table}" WHERE "${conditionColumn}" = ?`;
    params = [conditionValue];
  } else {
    query = `SELECT COUNT(*) as c FROM "${table}"`;
  }

  try {
    const row = db.prepare(query).get(...params) as { c: number };
    return row.c;
  } catch {
    return 0;
  }
}

export function siteMetric(metric: string): string {
  const db = getDb();
  const row = db.prepare(
    "SELECT value FROM site_metrics WHERE key = ?"
  ).get(metric) as { value: string } | undefined;
  return row?.value || "";
}
