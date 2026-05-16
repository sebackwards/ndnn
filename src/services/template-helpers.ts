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

export function lookup(table: string, field: string, condition: string): string {
  const db = getDb();
  const row = db.prepare(
    `SELECT ${field} FROM ${table} WHERE ${condition} LIMIT 1`
  ).get() as Record<string, unknown> | undefined;
  return row ? String(Object.values(row)[0]) : "";
}

export function count(table: string, condition?: string): number {
  const db = getDb();
  const query = condition
    ? `SELECT COUNT(*) as c FROM ${table} WHERE ${condition}`
    : `SELECT COUNT(*) as c FROM ${table}`;
  const row = db.prepare(query).get() as { c: number };
  return row.c;
}

export function siteMetric(metric: string): string {
  const db = getDb();
  const row = db.prepare(
    "SELECT value FROM site_metrics WHERE key = ?"
  ).get(metric) as { value: string } | undefined;
  return row?.value || "";
}
