import express from "express";
import cookieParser from "cookie-parser";
import pagesRouter from "./routes/pages";
import adminRouter from "./routes/admin";
import { notFoundHandler } from "./middleware/error-handler";
import { widgetPreviewMiddleware } from "./middleware/widget-preview";
import { MetricsWidget } from "./personalization/widgets/system-info";

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Widget preview: editors can test widget configs via X-Widget-Preview header
  app.use(widgetPreviewMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public visit counter — uses the MetricsWidget with awk probe to count
  // matching lines in the access log. Accepts ?path=<filter> to count visits.
  // Example: /health/visits?path=/api/pages returns how many log lines match.
  app.get("/health/visits", (req, res) => {
    const pathFilter = (req.query.path as string) || "/";
    const logFile = "/var/log/ndnn/access.log";

    // Escape forward slashes for awk regex context
    const awkPattern = pathFilter.replace(/\//g, "\\/");

    // Build awk args to count lines matching the path filter
    const awkArgs = `'/${awkPattern}/ {count++} END{print count+0}' ${logFile}`;

    const widget = new MetricsWidget({ probe: "awk", args: awkArgs });
    const html = widget.render({});

    // Extract the number from the widget HTML output
    const match = html.match(/<pre>([\s\S]*?)<\/pre>/);
    const output = match ? match[1].trim() : "0";
    const visits = parseInt(output, 10) || 0;

    res.json({ path: pathFilter, visits });
  });

  app.use("/api/pages", pagesRouter);
  app.use("/api/admin", adminRouter);

  // 404 handler with personalization — must be last
  app.use(notFoundHandler);

  return app;
}

if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`ndnn listening on port ${PORT}`);
  });
}
