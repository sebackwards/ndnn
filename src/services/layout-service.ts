import { getDb } from "../db";
import { enforceContentPolicy, PolicyResult } from "../policies/content-policy";

export interface Layout {
  id: string;
  name: string;
  slug: string;
  content: string;
  workspace_id: string;
  created_by: string;
  owner_role: string;
  is_system: number;
}

export interface LayoutSaveResult {
  success: boolean;
  id?: string;
  error?: string;
}

export class LayoutService {
  listLayouts(workspaceId: string): Layout[] {
    const db = getDb();
    return db
      .prepare(
        `SELECT l.*, u.role as owner_role FROM layouts l
         JOIN users u ON l.created_by = u.id
         WHERE l.workspace_id = ? OR l.is_system = 1
         ORDER BY l.name`
      )
      .all(workspaceId) as Layout[];
  }

  getLayout(slug: string, workspaceId: string): Layout | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT l.*, u.role as owner_role FROM layouts l
         JOIN users u ON l.created_by = u.id
         WHERE l.slug = ? AND (l.workspace_id = ? OR l.is_system = 1)
         LIMIT 1`
      )
      .get(slug, workspaceId) as Layout | undefined;

    return row || null;
  }

  saveLayout(
    userId: string,
    workspaceId: string,
    data: { name: string; slug: string; content: string }
  ): LayoutSaveResult {
    const policyResult: PolicyResult = enforceContentPolicy(data.content);
    if (!policyResult.allowed) {
      return { success: false, error: policyResult.reason };
    }

    const content = policyResult.sanitized || data.content;
    const db = getDb();
    const id = require("uuid").v4();

    db.prepare(
      `INSERT INTO layouts (id, name, slug, content, workspace_id, created_by, is_system)
       VALUES (?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(workspace_id, slug) DO UPDATE SET
         content = excluded.content,
         name = excluded.name`
    ).run(id, data.name, data.slug, content, workspaceId, userId);

    return { success: true, id };
  }

  deleteLayout(slug: string, workspaceId: string): boolean {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM layouts WHERE slug = ? AND workspace_id = ? AND is_system = 0")
      .run(slug, workspaceId);
    return result.changes > 0;
  }
}
