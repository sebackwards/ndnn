import { getDb } from "../db";
import { compileTemplate, buildRenderContext } from "./template-compiler";

const SITE_CONFIG: Record<string, unknown> = {
  siteName: "ndnn",
  companyName: "Acme Corp",
  supportEmail: "support@acme.example.com",
  themeColor: "#2563eb",
};

function loadTemplate(slot: string): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT content FROM user_content WHERE slot = ? AND type = 'template' ORDER BY updated_at DESC LIMIT 1"
    )
    .get(slot) as { content: string } | undefined;

  return row?.content || null;
}

export function renderSlot(
  slot: string,
  requestContext?: Record<string, unknown>
): string | null {
  const template = loadTemplate(slot);
  if (!template) return null;

  const context = buildRenderContext(SITE_CONFIG, requestContext);
  return compileTemplate(template, context);
}

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
