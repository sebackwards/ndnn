import express from "express";
import cookieParser from "cookie-parser";
import pagesRouter from "./routes/pages";
import adminRouter from "./routes/admin";
import preferencesRouter from "./routes/preferences";
import { notFoundHandler } from "./middleware/error-handler";

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/pages", pagesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/preferences", preferencesRouter);

  // 404 handler with custom templates — must be last
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
