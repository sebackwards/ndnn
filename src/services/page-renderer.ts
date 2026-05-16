import { getDb } from "../db";
import { compileTemplate, buildRenderContext } from "./template-compiler";

/**
 * Page renderer service.
 * Loads templates from the database and renders them with context data.
 * Used by the error handler and page display routes to render
 * personalized content.
 */

/** Site configuration loaded once at startup */
const SITE_CONFIG: Record<string, unknown> = {
  siteName: "ndnn",
  companyName: "Acme Corp",
  supportEmail: "support@acme.example.com",
  themeColor: "#2563eb",
};

/**
 * Retrieves a stored template by its slot name.
 * Templates are stored in the user_content table with type='template'.
 * Returns the most recently updated template for the given slot.
 */
function loadTemplate(slot: string): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT content FROM user_content WHERE slot = ? AND type = 'template' ORDER BY updated_at DESC LIMIT 1"
    )
    .get(slot) as { content: string } | undefined;

  return row?.content || null;
}

/**
 * Renders a named template slot with the given request context.
 * Falls back to a default template if no custom one is stored.
 */
export function renderSlot(
  slot: string,
  requestContext?: Record<string, unknown>
): string | null {
  const template = loadTemplate(slot);
  if (!template) return null;

  const context = buildRenderContext(SITE_CONFIG, requestContext);
  return compileTemplate(template, context);
}

/**
 * Renders the error page template.
 * Loads the 'error-page' slot and renders it with error context.
 */
export function renderErrorPage(
  statusCode: number,
  path: string
): string | null {
  return renderSlot("error-page", {
    statusCode,
    requestedPath: path,
    timestamp: new Date().toISOString(),
  });
}
