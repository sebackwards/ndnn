import { Request, Response } from "express";
import { getDb } from "../db";
import { compileTemplate } from "../services/template-compiler";
import { buildUserContext } from "../services/sandbox-config";

/**
 * Custom 404 handler that renders a branded error page.
 * Uses the USER context (formatting only, no data helpers)
 * to prevent any template injection from accessing the database.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const db = getDb();

  // Load the error page template from admin-owned content only
  const row = db
    .prepare(
      `SELECT uc.content FROM user_content uc
       JOIN users u ON uc.user_id = u.id
       WHERE uc.slot = 'error-page' AND uc.type = 'template' AND u.role = 'admin'
       ORDER BY uc.updated_at DESC LIMIT 1`
    )
    .get() as { content: string } | undefined;

  let body = "<h1>404 - Page Not Found</h1><p>The page you requested could not be found.</p>";

  if (row?.content) {
    // Render with safe context only (no data access helpers)
    const context = buildUserContext({
      siteName: "ndnn",
      companyName: "Acme Corp",
      year: new Date().getFullYear(),
      supportEmail: "support@acme.example.com",
      statusCode: 404,
      requestedPath: req.path,
    });

    try {
      body = compileTemplate(row.content, context);
    } catch {
      // Fall back to default on render error
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
<body>
  ${body}
  <p><a href="/">Return to homepage</a></p>
</body>
</html>`;

  res.status(404).send(html);
}
