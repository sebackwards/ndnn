import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { LayoutService } from "../services/layout-service";

const router = Router();
const layoutService = new LayoutService();

router.get("/", requireAuth, (req, res) => {
  const layouts = layoutService.listLayouts(req.user!.workspace_id);
  res.json({
    data: layouts.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      is_system: l.is_system,
      owner_role: l.owner_role,
    })),
  });
});

router.get("/:slug", requireAuth, (req, res) => {
  const layout = layoutService.getLayout(req.params.slug, req.user!.workspace_id);
  if (!layout) {
    return res.status(404).json({ error: "Layout not found" });
  }
  res.json(layout);
});

router.post("/", requireAuth, requireRole("admin", "editor"), (req, res) => {
  const { name, slug, content } = req.body;

  if (!name || !slug || !content) {
    return res.status(400).json({ error: "name, slug, and content are required" });
  }

  const result = layoutService.saveLayout(req.user!.id, req.user!.workspace_id, {
    name,
    slug,
    content,
  });

  if (!result.success) {
    return res.status(422).json({ error: result.error });
  }

  res.status(201).json({ id: result.id, slug });
});

router.delete("/:slug", requireAuth, requireRole("admin"), (req, res) => {
  const deleted = layoutService.deleteLayout(req.params.slug, req.user!.workspace_id);
  if (!deleted) {
    return res.status(404).json({ error: "Layout not found or is a system layout" });
  }
  res.json({ deleted: true });
});

export default router;
