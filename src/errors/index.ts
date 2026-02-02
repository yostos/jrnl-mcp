/**
 * Base error class for jrnl-mcp
 */
export class JrnlMcpError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when jrnl command is not found
 */
export class JrnlNotFoundError extends JrnlMcpError {
  constructor(message = "jrnl command not found") {
    super(message, "JRNL_NOT_FOUND");
  }
}

/**
 * Error thrown when jrnl execution fails
 */
export class JrnlExecutionError extends JrnlMcpError {
  constructor(
    message: string,
    public readonly exitCode?: number,
    public readonly stderr?: string,
  ) {
    super(message, "JRNL_EXECUTION_ERROR", { exitCode, stderr });
  }
}

/**
 * Error thrown when invalid arguments are provided
 */
export class InvalidArgumentError extends JrnlMcpError {
  constructor(
    message: string,
    public readonly argumentName?: string,
  ) {
    super(message, "INVALID_ARGUMENT", { argumentName });
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends JrnlMcpError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
  }
}

/**
 * Error thrown when journal is not found
 */
export class JournalNotFoundError extends JrnlMcpError {
  constructor(journalName: string) {
    super(`Journal '${journalName}' not found`, "JOURNAL_NOT_FOUND", {
      journalName,
    });
  }
}
