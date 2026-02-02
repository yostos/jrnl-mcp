/**
 * Utility for executing jrnl CLI commands and parsing results
 */
import { spawn } from "child_process";
import { JrnlNotFoundError, JrnlExecutionError } from "../errors/index.js";
import { logError, logDebug } from "./logger.js";

/**
 * Check if mock mode is enabled (for CI/testing)
 */
function isMockMode(): boolean {
  return process.env.JRNL_MCP_USE_MOCK === "true";
}

/**
 * Mock data for testing without real jrnl
 */
const MOCK_DATA = {
  tags: {
    "@work": 5,
    "@personal": 3,
    "@meeting": 2,
    "@idea": 1,
  },
  entries: [
    {
      date: "2024-01-15",
      time: "09:00",
      title: "Morning standup meeting",
      body: "Discussed project progress with the team. @work @meeting",
      tags: ["@work", "@meeting"],
      starred: false,
    },
    {
      date: "2024-01-15",
      time: "14:30",
      title: "New feature idea",
      body: "Had an interesting idea about improving the search functionality. @work @idea",
      tags: ["@work", "@idea"],
      starred: true,
    },
    {
      date: "2024-01-14",
      time: "20:00",
      title: "Evening reflection",
      body: "Spent time reading and relaxing after work. @personal",
      tags: ["@personal"],
      starred: false,
    },
    {
      date: "2024-01-13",
      time: "10:00",
      title: "Weekly review meeting",
      body: "Reviewed last week's accomplishments and set goals for the coming week. @work @meeting",
      tags: ["@work", "@meeting"],
      starred: false,
    },
    {
      date: "2024-01-12",
      time: "18:00",
      title: "Dinner with friends",
      body: "Had a great time catching up with old friends. @personal",
      tags: ["@personal"],
      starred: true,
    },
    {
      date: "2024-01-11",
      time: "09:30",
      title: "Project kickoff",
      body: "Started working on the new MCP integration project. @work",
      tags: ["@work"],
      starred: false,
    },
    {
      date: "2024-01-10",
      time: "21:00",
      title: "Reading notes",
      body: "Finished reading an interesting book about software architecture. @personal",
      tags: ["@personal"],
      starred: false,
    },
  ],
};

const MOCK_JOURNALS = ["default", "work", "personal"];

/**
 * Options for executing a jrnl command
 */
interface JrnlExecutorOptions {
  timeout?: number;
  journal?: string;
  maxBuffer?: number;
}

/**
 * Result of a jrnl command execution
 */
interface JrnlExecutionResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

/**
 * Default options for jrnl execution
 */
const DEFAULT_OPTIONS: JrnlExecutorOptions = {
  timeout: 30000, // 30 seconds
  maxBuffer: 1024 * 1024 * 5, // 5MB
};

/**
 * Execute a jrnl command and return the result
 *
 * @param args Command line arguments to pass to jrnl
 * @param options Execution options
 * @returns Promise with execution result
 */
export async function executeJrnlCommand(
  args: string[],
  options: JrnlExecutorOptions = {},
): Promise<JrnlExecutionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let commandArgs = [...args];

  // If journal is specified, add the --journal flag
  if (opts.journal) {
    commandArgs = ["--journal", opts.journal, ...commandArgs];
  }

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    // Spawn jrnl process with arguments
    const process = spawn("jrnl", commandArgs);

    // Set timeout if specified
    const timeoutId = opts.timeout
      ? setTimeout(() => {
          process.kill();
          killed = true;
          resolve({
            stdout,
            stderr: stderr + "\nCommand timed out after " + opts.timeout + "ms",
            success: false,
          });
        }, opts.timeout)
      : null;

    // Collect stdout
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    process.on("close", (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!killed) {
        resolve({
          stdout,
          stderr,
          success: code === 0,
        });
      }
    });

    // Handle errors (e.g., jrnl command not found)
    process.on("error", (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!killed) {
        logDebug(`jrnl process error: ${err.message}`, "jrnlExecutor");
        resolve({
          stdout,
          stderr: stderr + "\n" + err.message,
          success: false,
        });
      }
    });
  });
}

/**
 * Parse JSON output from jrnl command
 *
 * @param output Command output string
 * @returns Parsed JSON object
 */
export function parseJrnlJsonOutput<T>(output: string): T {
  try {
    return JSON.parse(output.trim()) as T;
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to parse jrnl output as JSON: ${error.message}`
        : "Failed to parse jrnl output as JSON";
    logError(error, "parseJrnlJsonOutput");
    throw new JrnlExecutionError(message);
  }
}

/**
 * Safely execute a jrnl command that outputs JSON and parse the result
 *
 * @param args Command line arguments
 * @param options Execution options
 * @returns Parsed JSON result
 */
export async function executeJrnlJsonCommand<T>(
  args: string[],
  options: JrnlExecutorOptions = {},
): Promise<T> {
  // Ensure export flag is included to get JSON output
  const commandArgs = [...args];
  if (!commandArgs.includes("--export") && !commandArgs.includes("-j")) {
    commandArgs.push("--export", "json");
  }

  const result = await executeJrnlCommand(commandArgs, options);

  if (!result.success) {
    // Check if jrnl command was not found
    if (
      result.stderr.includes("ENOENT") ||
      result.stderr.includes("not found")
    ) {
      throw new JrnlNotFoundError();
    }
    throw new JrnlExecutionError(`jrnl command failed: ${result.stderr}`);
  }

  return parseJrnlJsonOutput<T>(result.stdout);
}

export class JrnlExecutor {
  async execute(args: string[]): Promise<string> {
    logDebug(`Executing jrnl with args: ${args.join(" ")}`, "JrnlExecutor");

    // Use mock mode if enabled (for CI/testing)
    if (isMockMode()) {
      logDebug("Using mock mode", "JrnlExecutor");
      return this.executeMock(args);
    }

    const result = await executeJrnlCommand(args);

    if (!result.success) {
      // Check if jrnl command was not found
      if (
        result.stderr.includes("ENOENT") ||
        result.stderr.includes("not found")
      ) {
        throw new JrnlNotFoundError();
      }
      throw new JrnlExecutionError(`jrnl command failed: ${result.stderr}`);
    }

    // Clean jrnl output - remove decorative boxes and extra text
    const cleaned = this.cleanJrnlOutput(result.stdout);
    logDebug(`jrnl output cleaned, length: ${cleaned.length}`, "JrnlExecutor");

    return cleaned;
  }

  private executeMock(args: string[]): string {
    // Handle --version
    if (args.includes("--version")) {
      return "jrnl version 4.2 (mock)";
    }

    // Handle --list (list journals)
    if (args.includes("--list")) {
      return MOCK_JOURNALS.join("\n");
    }

    // Handle --tags (list tags)
    if (args.includes("--tags")) {
      return Object.entries(MOCK_DATA.tags)
        .map(([tag, count]) => `${tag} : ${count}`)
        .join("\n");
    }

    // Handle --export json (entries search)
    if (args.includes("--export") && args.includes("json")) {
      return this.handleMockSearch(args);
    }

    // Default: return mock entries as JSON
    return JSON.stringify(MOCK_DATA);
  }

  private handleMockSearch(args: string[]): string {
    interface MockEntry {
      date: string;
      time: string;
      title: string;
      body: string;
      tags: string[];
      starred: boolean;
    }

    let filteredEntries: MockEntry[] = [...MOCK_DATA.entries];

    // Handle tag filtering
    const tagArgs = args.filter((a) => a.startsWith("@"));
    if (tagArgs.length > 0) {
      filteredEntries = filteredEntries.filter((entry) =>
        tagArgs.some((tag) => entry.tags.includes(tag)),
      );
    }

    // Handle -starred
    if (args.includes("-starred")) {
      filteredEntries = filteredEntries.filter((entry) => entry.starred);
    }

    // Handle -from (date filtering)
    const fromIndex = args.indexOf("-from");
    if (fromIndex !== -1 && args[fromIndex + 1]) {
      const fromDate = args[fromIndex + 1];
      // Simple ISO date comparison for mock (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.date >= fromDate,
        );
      }
    }

    // Handle -to (date filtering)
    const toIndex = args.indexOf("-to");
    if (toIndex !== -1 && args[toIndex + 1]) {
      const toDate = args[toIndex + 1];
      // Simple ISO date comparison for mock (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.date <= toDate,
        );
      }
    }

    // Handle -n (limit)
    const nIndex = args.indexOf("-n");
    if (nIndex !== -1 && args[nIndex + 1]) {
      const limit = parseInt(args[nIndex + 1], 10);
      filteredEntries = filteredEntries.slice(0, limit);
    }

    // Handle -contains
    const containsIndex = args.indexOf("-contains");
    if (containsIndex !== -1 && args[containsIndex + 1]) {
      const searchText = args[containsIndex + 1].toLowerCase();
      filteredEntries = filteredEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchText) ||
          entry.body.toLowerCase().includes(searchText),
      );
    }

    // Recalculate tag counts for filtered entries
    const tags: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return JSON.stringify({ tags, entries: filteredEntries });
  }

  private cleanJrnlOutput(output: string): string {
    // Remove decorative box characters and summary lines
    const lines = output.split("\n");
    const cleanedLines = lines.filter((line) => {
      // Filter out decorative box lines and summary text
      return (
        !line.match(/^[┏┓┗┛━ ]+$/) &&
        !line.match(/^\s*\d+ entries? found\s*$/) &&
        !line.match(/^\s*no entries? found\s*$/) &&
        !line.match(/^Journals defined in config/) &&
        line.trim() !== ""
      );
    });

    const cleanedOutput = cleanedLines.join("\n").trim();

    // Check if jrnl returned "no entries found" - return empty JSON structure
    if (output.includes("no entries found") || cleanedOutput === "") {
      return '{"tags": {}, "entries": []}';
    }

    // For JSON export, try to extract just the JSON part
    if (cleanedOutput.includes("{") && cleanedOutput.includes("}")) {
      const jsonStart = cleanedOutput.indexOf("{");
      const jsonEnd = cleanedOutput.lastIndexOf("}") + 1;
      return cleanedOutput.substring(jsonStart, jsonEnd);
    }

    return cleanedOutput;
  }
}
