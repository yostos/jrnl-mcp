/**
 * Utility for executing jrnl CLI commands and parsing results
 */
import { spawn } from "child_process";
import { JrnlNotFoundError, JrnlExecutionError } from "../errors/index.js";
import { logError, logDebug } from "./logger.js";

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
