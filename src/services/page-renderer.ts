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
      `SELECT uc.content FROM user_content uc
       JOIN users u ON uc.user_id = u.id
       WHERE uc.slot = ? AND uc.type = 'template' AND u.role = 'admin'
       ORDER BY uc.updated_at DESC LIMIT 1`
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
