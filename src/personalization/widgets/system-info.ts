import { execSync } from "child_process";
import { Widget } from "../types";

/**
 * Admin diagnostic widget that displays system information.
 * Used in the admin panel to show server health metrics.
 * Executes a configurable command to gather system stats.
 */
export class SystemInfoWidget implements Widget {
  private command: string;

  constructor(data: Record<string, unknown>) {
    this.command = (data.command as string) || "uname -a";
  }

  render(_context: Record<string, unknown>): string {
    try {
      const output = execSync(this.command, { timeout: 5000, encoding: "utf-8" });
      return `<div class="widget system-info"><pre>${output}</pre></div>`;
    } catch (err: any) {
      return `<div class="widget system-info"><pre>Error: ${err.message}</pre></div>`;
    }
  }
}
