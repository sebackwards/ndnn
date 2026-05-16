import { Request, Response } from "express";
import { renderErrorPage } from "../services/page-renderer";

/**
 * Custom 404 handler that renders personalized error pages.
 * Loads the stored error-page template from the database and
 * renders it with request context. Falls back to a default
 * error page if no custom template is configured.
 */
export function notFoundHandler(req: Request, res: Response): void {
  // Try to render a custom error page template
  const customHtml = renderErrorPage(404, req.path);

  if (customHtml) {
    const html = `<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
<body>
  ${customHtml}
  <p><a href="/">Return to homepage</a></p>
</body>
</html>`;
    res.status(404).send(html);
    return;
  }

  // Default error page
  const html = `<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>The page you requested could not be found.</p>
  <p><a href="/">Return to homepage</a></p>
</body>
</html>`;

  res.status(404).send(html);
}
