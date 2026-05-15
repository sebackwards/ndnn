import { ProbeRunner } from "./probe-runner";

export interface MetricResult {
  probe: string;
  output: string;
  success: boolean;
  error?: string;
}

/**
 * Collects server metrics by running validated probe commands.
 * Used by the MetricsWidget to gather system health data.
 */
export class MetricsCollector {
  private runner: ProbeRunner;

  constructor() {
    this.runner = new ProbeRunner();
  }

  collect(probe: string, args: string = ""): MetricResult {
    try {
      const output = this.runner.execute(probe, args);
      return { probe, output: output.trim(), success: true };
    } catch (err: any) {
      return { probe, output: "", success: false, error: err.message };
    }
  }

  getAvailableProbes(): string[] {
    return this.runner.getAllowedProbes();
  }
}
