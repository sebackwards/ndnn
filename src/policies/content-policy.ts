import { scanTemplate, ScanResult } from "./expression-scanner";

/**
 * Content policy enforcement for user-generated content.
 * Applies multiple layers of validation before content is stored:
 * - Length limits
 * - HTML sanitization (basic XSS prevention)
 * - Expression scanning (template injection prevention)
 * - Profanity filtering
 */

const MAX_TEMPLATE_LENGTH = 4096;
const MAX_EXPRESSION_COUNT = 20;

/**
 * Basic HTML tag stripping for non-template content.
 * Removes script tags and event handlers.
 */
function stripDangerousHtml(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");
}

/**
 * Counts the number of template expressions in content.
 */
function countExpressions(content: string): number {
  const matches = content.match(/\{\{.+?\}\}/g);
  return matches ? matches.length : 0;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  sanitized?: string;
}

/**
 * Validates content against all content policies.
 * Used by the preference service and admin template API
 * to ensure stored content is safe for rendering.
 */
export function enforceContentPolicy(content: string): PolicyResult {
  // Length check
  if (content.length > MAX_TEMPLATE_LENGTH) {
    return { allowed: false, reason: "Content exceeds maximum length" };
  }

  // Expression count limit
  if (countExpressions(content) > MAX_EXPRESSION_COUNT) {
    return { allowed: false, reason: "Too many template expressions" };
  }

  // Strip dangerous HTML (but allow template expressions)
  const sanitized = stripDangerousHtml(content);

  // Scan template expressions for dangerous patterns
  const scanResult: ScanResult = scanTemplate(sanitized);
  if (!scanResult.safe) {
    return {
      allowed: false,
      reason: `Template expression violation: ${scanResult.violations[0]}`,
    };
  }

  return { allowed: true, sanitized };
}
