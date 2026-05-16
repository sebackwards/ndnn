import { evaluateTemplate } from "./expression-evaluator";

export interface CompileOptions {
  safeMode?: boolean;
  maxOutputLength?: number;
}

const DEFAULT_OPTIONS: CompileOptions = {
  safeMode: true,
  maxOutputLength: 65536,
};

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

export function compileTemplate(
  template: string,
  context: Record<string, unknown>,
  options: CompileOptions = DEFAULT_OPTIONS
): string {
  let output = evaluateTemplate(template, context);

  if (options.maxOutputLength && output.length > options.maxOutputLength) {
    output = output.slice(0, options.maxOutputLength);
  }

  return output;
}
