/**
 * Logger utility for MCP server
 *
 * This module provides a centralized way to log messages in an MCP server
 * without breaking the stdio transport protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { LoggingMessageNotification } from "@modelcontextprotocol/sdk/types.js";

type LogLevel = LoggingMessageNotification["params"]["level"];

/**
 * Check if debug mode is enabled via environment variable
 */
export function isDebugEnabled(): boolean {
  return process.env.JRNL_MCP_DEBUG === "true" || process.env.DEBUG === "true";
}

/**
 * Log an error message to stderr with timestamp
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";
  const errorMsg =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  process.stderr.write(`[${timestamp}]${contextStr} ERROR: ${errorMsg}\n`);

  if (isDebugEnabled() && error instanceof Error && error.stack) {
    process.stderr.write(`Stack trace:\n${error.stack}\n`);
  }
}

/**
 * Log an info message to stderr with timestamp
 */
export function logInfo(message: string, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";
  process.stderr.write(`[${timestamp}]${contextStr} INFO: ${message}\n`);
}

/**
 * Log a debug message to stderr with timestamp (only if debug mode is enabled)
 */
export function logDebug(message: string, context?: string): void {
  if (!isDebugEnabled()) return;

  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";
  process.stderr.write(`[${timestamp}]${contextStr} DEBUG: ${message}\n`);
}

export class MCPLogger {
  constructor(private server: Server) {}

  /**
   * Log a debug message
   */
  async debug(data: unknown, logger?: string): Promise<void> {
    await this.log("debug", data, logger);
  }

  /**
   * Log an info message
   */
  async info(data: unknown, logger?: string): Promise<void> {
    await this.log("info", data, logger);
  }

  /**
   * Log a notice message
   */
  async notice(data: unknown, logger?: string): Promise<void> {
    await this.log("notice", data, logger);
  }

  /**
   * Log a warning message
   */
  async warning(data: unknown, logger?: string): Promise<void> {
    await this.log("warning", data, logger);
  }

  /**
   * Log an error message
   */
  async error(data: unknown, logger?: string): Promise<void> {
    await this.log("error", data, logger);
  }

  /**
   * Log a critical message
   */
  async critical(data: unknown, logger?: string): Promise<void> {
    await this.log("critical", data, logger);
  }

  /**
   * Log an alert message
   */
  async alert(data: unknown, logger?: string): Promise<void> {
    await this.log("alert", data, logger);
  }

  /**
   * Log an emergency message
   */
  async emergency(data: unknown, logger?: string): Promise<void> {
    await this.log("emergency", data, logger);
  }

  /**
   * Generic log method
   */
  private async log(
    level: LogLevel,
    data: unknown,
    logger?: string,
  ): Promise<void> {
    try {
      const params: LoggingMessageNotification["params"] = {
        level,
        data,
      };

      if (logger) {
        params.logger = logger;
      }

      await this.server.sendLoggingMessage(params);
    } catch {
      // If logging fails, we can't log the error!
      // In production, you might want to write to a file as a fallback
    }
  }

  /**
   * Helper to format error objects for logging
   */
  formatError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return {
      error: String(error),
    };
  }

  /**
   * Helper to log function entry/exit
   */
  async logFunction(
    functionName: string,
    phase: "enter" | "exit" | "error",
    details?: Record<string, unknown>,
  ): Promise<void> {
    const level: LogLevel = phase === "error" ? "error" : "debug";
    await this.log(
      level,
      {
        function: functionName,
        phase,
        ...details,
      },
      "function-trace",
    );
  }
}
