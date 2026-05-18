import * as helpers from "./template-helpers";

export interface RenderContext {
  [key: string]: unknown;
}

const FORMATTING_GLOBALS = {
  formatDate: helpers.formatDate,
  formatNumber: helpers.formatNumber,
  truncate: helpers.truncate,
  pluralize: helpers.pluralize,
  uppercase: helpers.uppercase,
  lowercase: helpers.lowercase,
  now: () => new Date().toISOString(),
};

const DATA_ACCESS_GLOBALS = {
  lookup: helpers.lookup,
  count: helpers.count,
  siteMetric: helpers.siteMetric,
};

export function buildSystemContext(
  pageData?: Record<string, unknown>
): RenderContext {
  return {
    helpers: { ...FORMATTING_GLOBALS, ...DATA_ACCESS_GLOBALS },
    ...pageData,
  };
}

export function buildUserContext(
  pageData?: Record<string, unknown>
): RenderContext {
  return {
    helpers: { ...FORMATTING_GLOBALS },
    ...pageData,
  };
}

export function getContextForRole(role: string): typeof buildSystemContext {
  if (role === "admin") {
    return buildSystemContext;
  }
  return buildUserContext;
}
