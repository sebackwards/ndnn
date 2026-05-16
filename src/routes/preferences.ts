import { Router } from "express";
import { requireAuth } from "../auth";
import {
  savePreference,
  getPreference,
  listPreferences,
} from "../services/preference-service";

const router = Router();

router.post("/", requireAuth, (req, res) => {
  const { slot, content, type } = req.body;

  if (!slot || !content) {
    return res.status(400).json({ error: "slot and content are required" });
  }

  if (type && !["template", "setting"].includes(type)) {
    return res.status(400).json({ error: "type must be 'template' or 'setting'" });
  }

  const result = savePreference(req.user!.id, {
    slot,
    content,
    type: type || "template",
  });

  if (!result.success) {
    return res.status(422).json({ error: result.error });
  }

  res.status(201).json({ saved: true, slot });
});

router.get("/", requireAuth, (req, res) => {
  const prefs = listPreferences(req.user!.id);
  res.json({ data: prefs });
});

router.get("/:slot", requireAuth, (req, res) => {
  const pref = getPreference(req.user!.id, req.params.slot);
  if (!pref) {
    return res.status(404).json({ error: "Preference not found" });
  }
  res.json(pref);
});

export default router;
