import { Request, Response } from "express";
import { renderErrorPage } from "../services/page-renderer";

export function notFoundHandler(req: Request, res: Response): void {
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
