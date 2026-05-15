import { Request, Response } from "express";
import { deserializeWidgets } from "../personalization/deserializer";

/**
 * Custom 404 handler that renders personalized error pages.
 * Reads the nxPersonalization cookie to display contextual widgets
 * (recent pages, breadcrumbs, branding) on the error page.
 */
export function notFoundHandler(req: Request, res: Response): void {
  let widgetHtml = "";

  // Read personalization cookie for contextual widgets
  const personalizationCookie = req.cookies?.nxPersonalization;
  if (personalizationCookie) {
    const widgets = deserializeWidgets(personalizationCookie);
    const context = { requestedPath: req.path, method: req.method };

    for (const widget of widgets) {
      widgetHtml += widget.render(context);
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>The page you requested could not be found.</p>
  ${widgetHtml}
  <p><a href="/">Return to homepage</a></p>
</body>
</html>`;

  res.status(404).send(html);
}
