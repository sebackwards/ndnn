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

function extractExpressions(template: string): string[] {
  const expressions: string[] = [];
  const regex = /\{\{(.+?)\}\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    expressions.push(match[1].trim());
  }
  return expressions;
}

function isBlockedIdentifier(expr: string): boolean {
  const firstToken = expr.split(/[.\[(\s]/)[0].trim();
  return BLOCKED_IDENTIFIERS.has(firstToken);
}

function matchesBlockedPattern(expr: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(expr));
}

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
