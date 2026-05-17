import * as helpers from "./template-helpers";

/**
 * Sandbox configuration for template rendering contexts.
 *
 * Templates are rendered in a restricted environment where only
 * explicitly approved globals are available. This prevents arbitrary
 * code execution while allowing useful formatting and data access.
 *
 * Two context levels are defined:
 * - SYSTEM_CONTEXT: Full access including data helpers. Used for
 *   system-level templates (error pages, admin layouts).
 * - USER_CONTEXT: Formatting only. Used for user-created content
 *   that hasn't been reviewed by an administrator.
 */

export interface RenderContext {
  [key: string]: unknown;
}

/**
 * Safe formatting functions available to all templates.
 * These cannot access the database or filesystem.
 */
const FORMATTING_GLOBALS = {
  formatDate: helpers.formatDate,
  formatNumber: helpers.formatNumber,
  truncate: helpers.truncate,
  pluralize: helpers.pluralize,
  uppercase: helpers.uppercase,
  lowercase: helpers.lowercase,
  now: () => new Date().toISOString(),
};

/**
 * Data access functions available to system/admin templates.
 * These are considered safe because they validate table names
 * against an allowlist before executing queries.
 */
const DATA_ACCESS_GLOBALS = {
  lookup: helpers.lookup,
  count: helpers.count,
  siteMetric: helpers.siteMetric,
};

/**
 * Builds the rendering context for system-level templates.
 * Includes both formatting and data access helpers.
 * Used for: admin-created layouts, system error pages.
 */
export function buildSystemContext(
  pageData?: Record<string, unknown>
): RenderContext {
  return {
    helpers: { ...FORMATTING_GLOBALS, ...DATA_ACCESS_GLOBALS },
    ...pageData,
  };
}

/**
 * Builds the rendering context for user-created templates.
 * Only includes formatting helpers — no database access.
 * Used for: editor-created layouts, user preferences.
 */
export function buildUserContext(
  pageData?: Record<string, unknown>
): RenderContext {
  return {
    helpers: { ...FORMATTING_GLOBALS },
    ...pageData,
  };
}

/**
 * Returns the appropriate context builder based on the template owner's role.
 * Admin-owned templates get full access; all others get restricted access.
 */
export function getContextForRole(role: string): typeof buildSystemContext {
  if (role === "admin") {
    return buildSystemContext;
  }
  return buildUserContext;
}
