import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, requireRole } from "../auth";
import { getDb } from "../db";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, title, slug, published, created_at FROM pages WHERE workspace_id = ?")
    .all(req.user!.workspace_id);
  res.json({ data: rows });
});

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(req.params.id) as any;

  if (!row || row.workspace_id !== req.user!.workspace_id) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(row);
});

router.post("/", requireAuth, requireRole("admin", "editor"), (req, res) => {
  const { title, slug, content } = req.body;
  if (!title || !slug) {
    res.status(400).json({ error: "title and slug are required" });
    return;
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    "INSERT INTO pages (id, title, slug, content, workspace_id, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, title, slug, content || "", req.user!.workspace_id, req.user!.id);

  res.status(201).json({ id, title, slug });
});

router.put("/:id", requireAuth, requireRole("admin", "editor"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(req.params.id) as any;

  if (!row || row.workspace_id !== req.user!.workspace_id) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const { title, content, published } = req.body;
  db.prepare(
    "UPDATE pages SET title = COALESCE(?, title), content = COALESCE(?, content), published = COALESCE(?, published) WHERE id = ?"
  ).run(title ?? null, content ?? null, published ?? null, req.params.id);

  res.json({ updated: true });
});

router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(req.params.id) as any;

  if (!row || row.workspace_id !== req.user!.workspace_id) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  db.prepare("DELETE FROM pages WHERE id = ?").run(req.params.id);
  res.json({ deleted: true });
});

export default router;
