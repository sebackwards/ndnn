import { evaluateTemplate } from "./expression-evaluator";

/**
 * Template compiler for the page rendering system.
 * Compiles stored templates by evaluating expressions against
 * a rendering context (site info, user preferences, page data).
 *
 * Templates support {{expression}} syntax for dynamic content.
 * The compiler delegates expression evaluation to the expression evaluator.
 */

export interface CompileOptions {
  /** Enable safe mode — restricts available context (currently advisory only) */
  safeMode?: boolean;
  /** Maximum output length before truncation */
  maxOutputLength?: number;
}

const DEFAULT_OPTIONS: CompileOptions = {
  safeMode: true,
  maxOutputLength: 65536,
};

/**
 * Builds the rendering context from site configuration and request data.
 * This context is passed to the expression evaluator.
 */
export function buildRenderContext(
  siteConfig: Record<string, unknown>,
  requestData?: Record<string, unknown>
): Record<string, unknown> {
  return {
    siteName: siteConfig.siteName || "ndnn",
    companyName: siteConfig.companyName || "Acme Corp",
    year: new Date().getFullYear(),
    supportEmail: siteConfig.supportEmail || "support@example.com",
    ...requestData,
  };
}

/**
 * Compiles a template string by evaluating all expressions.
 * Returns the rendered HTML string.
 */
export function compileTemplate(
  template: string,
  context: Record<string, unknown>,
  options: CompileOptions = DEFAULT_OPTIONS
): string {
  // Evaluate all template expressions
  let output = evaluateTemplate(template, context);

  // Truncate if needed
  if (options.maxOutputLength && output.length > options.maxOutputLength) {
    output = output.slice(0, options.maxOutputLength);
  }

  return output;
}
