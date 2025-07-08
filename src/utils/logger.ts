/**
 * Logger utility for MCP server
 *
 * This module provides a centralized way to log messages in an MCP server
 * without breaking the stdio transport protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { LoggingMessageNotification } from "@modelcontextprotocol/sdk/types.js";

type LogLevel = LoggingMessageNotification["params"]["level"];

export class MCPLogger {
  constructor(private server: Server) {}

  /**
   * Log a debug message
   */
  async debug(data: any, logger?: string): Promise<void> {
    await this.log("debug", data, logger);
  }

  /**
   * Log an info message
   */
  async info(data: any, logger?: string): Promise<void> {
    await this.log("info", data, logger);
  }

  /**
   * Log a notice message
   */
  async notice(data: any, logger?: string): Promise<void> {
    await this.log("notice", data, logger);
  }

  /**
   * Log a warning message
   */
  async warning(data: any, logger?: string): Promise<void> {
    await this.log("warning", data, logger);
  }

  /**
   * Log an error message
   */
  async error(data: any, logger?: string): Promise<void> {
    await this.log("error", data, logger);
  }

  /**
   * Log a critical message
   */
  async critical(data: any, logger?: string): Promise<void> {
    await this.log("critical", data, logger);
  }

  /**
   * Log an alert message
   */
  async alert(data: any, logger?: string): Promise<void> {
    await this.log("alert", data, logger);
  }

  /**
   * Log an emergency message
   */
  async emergency(data: any, logger?: string): Promise<void> {
    await this.log("emergency", data, logger);
  }

  /**
   * Generic log method
   */
  private async log(
    level: LogLevel,
    data: any,
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
    } catch (error) {
      // If logging fails, we can't log the error!
      // In production, you might want to write to a file as a fallback
    }
  }

  /**
   * Helper to format error objects for logging
   */
  formatError(error: unknown): Record<string, any> {
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
    details?: any,
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
