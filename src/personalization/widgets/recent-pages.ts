import { Widget } from "../types";
import { getDb } from "../../db";

/**
 * Shows the user's most recently visited pages on error pages.
 * Helps users navigate back to content they were looking at.
 */
export class RecentPagesWidget implements Widget {
  private workspaceId: string;
  private limit: number;

  constructor(data: Record<string, unknown>) {
    this.workspaceId = (data.workspaceId as string) || "";
    this.limit = (data.limit as number) || 5;
  }

  render(_context: Record<string, unknown>): string {
    const db = getDb();
    const pages = db
      .prepare("SELECT title, slug FROM pages WHERE workspace_id = ? AND published = 1 LIMIT ?")
      .all(this.workspaceId, this.limit) as any[];

    const links = pages.map((p) => `<li><a href="/${p.slug}">${p.title}</a></li>`).join("");
    return `<div class="widget recent-pages"><h3>Recent Pages</h3><ul>${links}</ul></div>`;
  }
}
