/**
 * Expression evaluator for the template engine.
 * Evaluates template expressions ({{...}}) against a context object.
 *
 * Supports:
 * - Simple variable lookup: {{userName}}
 * - Dot notation for nested objects: {{user.name}}
 * - Default values: {{title || "Untitled"}}
 *
 * The evaluator uses dynamic function construction to support
 * complex expressions while maintaining flexibility for template authors.
 */

/**
 * Evaluates a single expression string against the provided context.
 * Uses Function constructor to support dot notation and logical operators.
 */
export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
): string {
  try {
    // Build a function that has access to all context keys as local variables
    const keys = Object.keys(context);
    const values = Object.values(context);

    // Create a function with context keys as parameters
    // This allows expressions like {{userName}} or {{site.title}}
    const fn = new Function(
      ...keys,
      `"use strict"; try { return (${expression}); } catch(e) { return ""; }`
    );

    const result = fn(...values);
    return result != null ? String(result) : "";
  } catch {
    // If expression evaluation fails, return empty string
    return "";
  }
}

/**
 * Processes a template string, replacing all {{expression}} blocks
 * with their evaluated values from the context.
 */
export function evaluateTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_match, expr: string) => {
    return evaluateExpression(expr.trim(), context);
  });
}
