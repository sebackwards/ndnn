import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { getDb } from "../db";
import { MetricsWidget } from "../personalization/widgets/system-info";
import { getRegisteredTypes } from "../personalization/registry";
import { MetricsCollector } from "../services/metrics-collector";

const router = Router();

// GET /api/admin/metrics — admin-only server metrics
router.get("/metrics", requireAuth, requireRole("admin"), (req, res) => {
  const probe = (req.query.probe as string) || "uptime";
  const args = (req.query.args as string) || "";
  const widget = new MetricsWidget({ probe, args });
  const output = widget.render({});
  res.json({ html: output });
});

// GET /api/admin/probes — list available metric probes
router.get("/probes", requireAuth, requireRole("admin"), (req, res) => {
  const collector = new MetricsCollector();
  res.json({ probes: collector.getAvailableProbes() });
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
