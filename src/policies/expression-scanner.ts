/**
 * Expression scanner for user-generated template content.
 * Scans template expressions ({{...}}) for dangerous patterns
 * before they are stored in the database.
 *
 * Blocks known dangerous identifiers that could lead to
 * code execution or information disclosure.
 */

/**
 * List of blocked top-level identifiers.
 * These cannot appear as the first token in an expression.
 */
const BLOCKED_IDENTIFIERS = new Set([
  "process",
  "require",
  "global",
  "globalThis",
  "eval",
  "Function",
  "constructor",
  "module",
  "exports",
  "import",
  "__proto__",
  "__dirname",
  "__filename",
]);

/**
 * Patterns that indicate dangerous function calls.
 */
const BLOCKED_PATTERNS = [
  /\bexec\s*\(/i,
  /\bspawn\s*\(/i,
  /\bchild_process\b/i,
  /\breadFileSync\b/i,
  /\bwriteFileSync\b/i,
  /\bunlink\b/i,
];

export interface ScanResult {
  safe: boolean;
  violations: string[];
}

/**
 * Extracts expression tokens from a template string.
 * Finds all {{...}} blocks and returns their contents.
 */
function extractExpressions(template: string): string[] {
  const expressions: string[] = [];
  const regex = /\{\{(.+?)\}\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    expressions.push(match[1].trim());
  }
  return expressions;
}

/**
 * Checks if an expression starts with a blocked identifier.
 * Only checks the first token (before any dot or bracket).
 */
function isBlockedIdentifier(expr: string): boolean {
  // Extract the first identifier (before . or [ or ()
  const firstToken = expr.split(/[.\[(\s]/)[0].trim();
  return BLOCKED_IDENTIFIERS.has(firstToken);
}

/**
 * Checks if an expression matches any blocked pattern.
 */
function matchesBlockedPattern(expr: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(expr));
}

/**
 * Scans a template string for dangerous expressions.
 * Returns a result indicating whether the template is safe
 * and any violations found.
 */
export function scanTemplate(template: string): ScanResult {
  const violations: string[] = [];
  const expressions = extractExpressions(template);

  for (const expr of expressions) {
    if (isBlockedIdentifier(expr)) {
      violations.push(`Blocked identifier in expression: ${expr}`);
    }
    if (matchesBlockedPattern(expr)) {
      violations.push(`Dangerous pattern in expression: ${expr}`);
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}
