import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { getDb } from "../db";

const router = Router();

// GET /api/admin/users — list all users in the workspace
router.get("/users", requireAuth, requireRole("admin"), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, username, email, role FROM users WHERE workspace_id = ?")
    .all(req.user!.workspace_id);
  res.json({ data: rows });
});

// GET /api/admin/templates — list all stored templates
router.get("/templates", requireAuth, requireRole("admin"), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, user_id, slot, content, type, updated_at FROM user_content WHERE type = 'template' ORDER BY updated_at DESC")
    .all();
  res.json({ data: rows });
});

export default router;
