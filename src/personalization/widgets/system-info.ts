import { Widget } from "../types";
import { MetricsCollector } from "../../services/metrics-collector";

/**
 * Metrics widget that displays server health information.
 * Collects data using validated probe commands through the MetricsCollector.
 * The probe must be in the allowed set (df, uptime, find, cat, grep, etc.)
 */
export class MetricsWidget implements Widget {
  private probe: string;
  private args: string;

  constructor(data: Record<string, unknown>) {
    this.probe = (data.probe as string) || "uptime";
    this.args = (data.args as string) || "";
  }

  render(_context: Record<string, unknown>): string {
    const collector = new MetricsCollector();
    const result = collector.collect(this.probe, this.args);

    if (result.success) {
      return `<div class="widget metrics"><pre>${result.output}</pre></div>`;
    }
    return `<div class="widget metrics"><pre>Metric unavailable: ${result.error}</pre></div>`;
  }
}
