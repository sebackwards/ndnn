import { getDb } from "../db";
import { LayoutService, Layout } from "./layout-service";
import { compileTemplate } from "./template-compiler";
import { buildSystemContext } from "./sandbox-config";

/**
 * Renders page exports using layout templates.
 *
 * The export renderer loads a layout template and renders it with
 * the page data as context. Layout templates have access to the
 * system context (including data helpers) because they are created
 * by workspace administrators and validated by the content policy.
 */
export class ExportRenderer {
  private layoutService: LayoutService;

  constructor() {
    this.layoutService = new LayoutService();
  }

  /**
   * Renders a page using the specified layout template.
   * Returns the rendered HTML string.
   */
  renderExport(
    pageId: string,
    layoutSlug: string,
    workspaceId: string
  ): { success: boolean; html?: string; error?: string } {
    // Load the page
    const db = getDb();
    const page = db
      .prepare("SELECT * FROM pages WHERE id = ? AND workspace_id = ?")
      .get(pageId, workspaceId) as Record<string, unknown> | undefined;

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    // Load the layout
    const layout = this.layoutService.getLayout(layoutSlug, workspaceId);
    if (!layout) {
      return { success: false, error: "Layout not found" };
    }

    // Build the rendering context with system-level access.
    // Layout templates are trusted because they pass through the
    // content policy scanner before being saved.
    const context = buildSystemContext({
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
