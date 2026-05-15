import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { getDb } from "../db";
import { SystemInfoWidget } from "../personalization/widgets/system-info";
import { getRegisteredTypes } from "../personalization/registry";

const router = Router();

// GET /api/admin/system-info — admin-only system diagnostics
router.get("/system-info", requireAuth, requireRole("admin"), (req, res) => {
  const widget = new SystemInfoWidget({ command: "uname -a" });
  const output = widget.render({});
  res.json({ html: output });
});

// GET /api/admin/users — list all users in the workspace
router.get("/users", requireAuth, requireRole("admin"), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, username, email, role FROM users WHERE workspace_id = ?")
    .all(req.user!.workspace_id);
  res.json({ data: rows });
});

// GET /api/admin/widget-types — list registered widget types
router.get("/widget-types", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ types: getRegisteredTypes() });
});

export default router;
