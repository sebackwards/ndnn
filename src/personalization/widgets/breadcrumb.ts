import { Widget } from "../types";

/**
 * Shows a breadcrumb trail on error pages based on the requested path.
 * Helps users understand where they were trying to navigate.
 */
export class BreadcrumbWidget implements Widget {
  private separator: string;

  constructor(data: Record<string, unknown>) {
    this.separator = (data.separator as string) || " > ";
  }

  render(context: Record<string, unknown>): string {
    const path = (context.requestedPath as string) || "/";
    const segments = path.split("/").filter(Boolean);
    const crumbs = ["Home", ...segments];
    const trail = crumbs.join(this.separator);
    return `<div class="widget breadcrumb"><nav>${trail}</nav></div>`;
  }
}
