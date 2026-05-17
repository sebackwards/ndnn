import { Router } from "express";
import { requireAuth } from "../auth";
import { ExportRenderer } from "../services/export-renderer";

const router = Router();
const exportRenderer = new ExportRenderer();

// POST /api/pages/:id/export — export a page using a layout template
router.post("/:id/export", requireAuth, (req, res) => {
  const { layout } = req.body;

  if (!layout) {
    return res.status(400).json({ error: "layout slug is required" });
  }

  const result = exportRenderer.renderExport(
    req.params.id,
    layout,
    req.user!.workspace_id
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ html: result.html });
});

export default router;
