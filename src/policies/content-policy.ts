import { scanTemplate, ScanResult } from "./expression-scanner";

const MAX_TEMPLATE_LENGTH = 4096;
const MAX_EXPRESSION_COUNT = 20;

function stripDangerousHtml(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");
}

function countExpressions(content: string): number {
  const matches = content.match(/\{\{.+?\}\}/g);
  return matches ? matches.length : 0;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  sanitized?: string;
}

export function enforceContentPolicy(content: string): PolicyResult {
  if (content.length > MAX_TEMPLATE_LENGTH) {
    return { allowed: false, reason: "Content exceeds maximum length" };
  }

  if (countExpressions(content) > MAX_EXPRESSION_COUNT) {
    return { allowed: false, reason: "Too many template expressions" };
  }

  const sanitized = stripDangerousHtml(content);

  const scanResult: ScanResult = scanTemplate(sanitized);
  if (!scanResult.safe) {
    return {
      allowed: false,
      reason: `Template expression violation: ${scanResult.violations[0]}`,
    };
  }

  return { allowed: true, sanitized };
}
