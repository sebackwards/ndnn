import * as helpers from "./template-helpers";

function resolvePath(path: string, context: Record<string, unknown>): unknown {
  const segments = path.split(".");
  let current: unknown = context;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function callFunction(
  fnPath: string,
  args: string[],
  context: Record<string, unknown>
): string {
  const fn = resolvePath(fnPath, context);
  if (typeof fn !== "function") return "";

  const parsedArgs = args.map((arg) => {
    const trimmed = arg.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    if (!isNaN(Number(trimmed))) return Number(trimmed);
    return resolvePath(trimmed, context) ?? trimmed;
  });

  try {
    return String(fn(...parsedArgs));
  } catch {
    return "";
  }
}

export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
): string {
  const fnMatch = expression.match(/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\((.*)?\)$/);
  if (fnMatch) {
    const fnPath = fnMatch[1];
    const argsStr = fnMatch[2] || "";
    const args = argsStr ? argsStr.split(",") : [];
    return callFunction(fnPath, args, context);
  }

  const orParts = expression.split("||").map((p) => p.trim());
  for (const part of orParts) {
    if ((part.startsWith('"') && part.endsWith('"')) ||
        (part.startsWith("'") && part.endsWith("'"))) {
      return part.slice(1, -1);
    }
    if (!isNaN(Number(part))) return part;

    const value = resolvePath(part, context);
    if (value != null && value !== "") return String(value);
  }

  return "";
}

export function evaluateTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  const fullContext = { ...context, helpers };
  return template.replace(/\{\{(.+?)\}\}/g, (_match, expr: string) => {
    return evaluateExpression(expr.trim(), fullContext);
  });
}
