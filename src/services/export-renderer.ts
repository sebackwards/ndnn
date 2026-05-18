import { getDb } from "../db";
import { LayoutService, Layout } from "./layout-service";
import { compileTemplate } from "./template-compiler";
import { getContextForRole } from "./sandbox-config";

export class ExportRenderer {
  private layoutService: LayoutService;

  constructor() {
    this.layoutService = new LayoutService();
  }

  renderExport(
    pageId: string,
    layoutSlug: string,
    workspaceId: string
  ): { success: boolean; html?: string; error?: string } {
    const db = getDb();
    const page = db
      .prepare("SELECT * FROM pages WHERE id = ? AND workspace_id = ?")
      .get(pageId, workspaceId) as Record<string, unknown> | undefined;

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    const layout = this.layoutService.getLayout(layoutSlug, workspaceId);
    if (!layout) {
      return { success: false, error: "Layout not found" };
    }

    const contextBuilder = getContextForRole(layout.owner_role);
    const context = contextBuilder({
      page,
      siteName: "ndnn",
      exportDate: new Date().toISOString(),
      workspaceId,
    });

    try {
      const html = compileTemplate(layout.content, context);
      return { success: true, html };
    } catch (err: any) {
      return { success: false, error: `Render failed: ${err.message}` };
    }
  }
}
