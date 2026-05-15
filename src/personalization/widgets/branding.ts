import { Widget } from "../types";

/**
 * Renders workspace branding (logo text, tagline) on error pages.
 * Provides a consistent brand experience even on 404s.
 */
export class BrandingWidget implements Widget {
  private logoText: string;
  private tagline: string;

  constructor(data: Record<string, unknown>) {
    this.logoText = (data.logoText as string) || "NDNN";
    this.tagline = (data.tagline as string) || "Content Management";
  }

  render(_context: Record<string, unknown>): string {
    return `<div class="widget branding"><h1>${this.logoText}</h1><p>${this.tagline}</p></div>`;
  }
}
