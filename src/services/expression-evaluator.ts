export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
): string {
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);

    const fn = new Function(
      ...keys,
      `"use strict"; try { return (${expression}); } catch(e) { return ""; }`
    );

    const result = fn(...values);
    return result != null ? String(result) : "";
  } catch {
    return "";
  }
}

export function evaluateTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_match, expr: string) => {
    return evaluateExpression(expr.trim(), context);
  });
}
