import { execFile } from "child_process";
import { promisify } from "util";
import { BdIssue } from "../types";

const execFileAsync = promisify(execFile);

export class BeadsIssueService {
  constructor(private readonly workspaceRoot?: string) {}

  async fetchIssues(): Promise<BdIssue[]> {
    const result = await this.runBd(["list", "--json"]);
    return Array.isArray(result) ? (result as BdIssue[]) : [];
  }

  async fetchIssue(issueId: string): Promise<BdIssue | null> {
    if (!issueId) {
      return null;
    }
    const result = await this.runBd(["show", issueId, "--json"]);
    if (Array.isArray(result)) {
      return (result[0] as BdIssue) ?? null;
    }
    return result && typeof result === "object" ? (result as BdIssue) : null;
  }

  private async runBd(args: string[]): Promise<unknown> {
    if (!this.workspaceRoot) {
      throw new Error("Open a workspace folder that contains a .beads database to load issues.");
    }

    try {
      const { stdout } = await execFileAsync("bd", args, {
        cwd: this.workspaceRoot,
        maxBuffer: 10 * 1024 * 1024,
      });
      const trimmed = stdout.trim();
      if (!trimmed) {
        return [];
      }
      try {
        return JSON.parse(trimmed);
      } catch (jsonError) {
        const lines = trimmed
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length > 1) {
          return lines.map((line) => JSON.parse(line));
        }
        const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
        throw new Error(`Failed to parse JSON from bd: ${jsonMessage}`);
      }
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        throw new Error(
          "Could not find the `bd` CLI on your PATH. Install beads or expose the command before using this view."
        );
      }
      throw new Error(nodeError.message || "Unknown error while running `bd`.");
    }
  }
}
