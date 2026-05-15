import { execSync } from "child_process";

/**
 * Allowed probe commands for metrics collection.
 * Only these base commands can be executed by the metrics system.
 */
const ALLOWED_PROBES = new Set(["df", "uptime", "find", "cat", "grep", "wc", "ls", "du"]);

/**
 * Executes a metrics probe command.
 * Validates that the base command is in the allowlist before execution.
 */
export class ProbeRunner {
  execute(probe: string, args: string): string {
    const baseCommand = probe.trim().toLowerCase();

    if (!ALLOWED_PROBES.has(baseCommand)) {
      throw new Error(`Probe command not allowed: ${baseCommand}`);
    }

    const fullCommand = args ? `${baseCommand} ${args}` : baseCommand;

    return execSync(fullCommand, {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  }

  getAllowedProbes(): string[] {
    return Array.from(ALLOWED_PROBES);
  }
}
