# MCP Server Logging Guide

## Overview

When developing an MCP (Model Context Protocol) server, it's crucial to understand that **you cannot use `console.log`, `console.error`, or any other console methods** when using the stdio transport. This is because MCP servers communicate with clients over stdin/stdout, and any output to stdout that isn't properly formatted JSON-RPC will break the protocol and cause the client to disconnect.

## The Problem with Console Logging

In a typical Node.js application, you might use:

```typescript
console.log("Debug information");
console.error("An error occurred");
```

However, in an MCP server using stdio transport:
- `console.log` writes to stdout, which is reserved for MCP protocol messages
- `console.error` writes to stderr, which can also cause issues with some MCP clients
- Any unexpected output breaks the JSON-RPC communication

## The Solution: Use MCP's Built-in Logging

The `@modelcontextprotocol/sdk` provides a proper logging mechanism through the `sendLoggingMessage` method on the Server instance.

### Basic Usage

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server({
  name: "my-mcp-server",
  version: "1.0.0"
}, {
  capabilities: {
    logging: {},  // Enable logging capability
    tools: {}
  }
});

// Send a log message
await server.sendLoggingMessage({
  level: "info",
  data: "Server initialized successfully"
});
```

### Log Levels

MCP supports the following log levels (from least to most severe):
- `debug` - Detailed information for debugging
- `info` - General informational messages
- `notice` - Normal but significant conditions
- `warning` - Warning conditions
- `error` - Error conditions
- `critical` - Critical conditions
- `alert` - Action must be taken immediately
- `emergency` - System is unusable

### Logging Examples

```typescript
// Debug logging
await server.sendLoggingMessage({
  level: "debug",
  data: "Processing request with parameters",
  logger: "request-handler"  // Optional logger name
});

// Info logging
await server.sendLoggingMessage({
  level: "info",
  data: "Successfully connected to database"
});

// Warning logging
await server.sendLoggingMessage({
  level: "warning",
  data: "Rate limit approaching threshold"
});

// Error logging
await server.sendLoggingMessage({
  level: "error",
  data: {
    message: "Failed to process request",
    error: error.message,
    stack: error.stack
  }
});
```

### Logging Complex Data

The `data` field can contain any JSON-serializable value:

```typescript
// Log an object
await server.sendLoggingMessage({
  level: "info",
  data: {
    event: "user_action",
    userId: "12345",
    action: "search",
    timestamp: new Date().toISOString()
  }
});

// Log an array
await server.sendLoggingMessage({
  level: "debug",
  data: ["step1", "step2", "step3"]
});
```

## Best Practices

### 1. Enable Logging Capability

Always declare the logging capability in your server initialization:

```typescript
const server = new Server({
  name: "my-server",
  version: "1.0.0"
}, {
  capabilities: {
    logging: {},  // This tells clients that your server supports logging
    // ... other capabilities
  }
});
```

### 2. Use Appropriate Log Levels

- Use `debug` for detailed diagnostic information
- Use `info` for general flow and state changes
- Use `warning` for recoverable issues
- Use `error` for errors that need attention

### 3. Structure Your Log Data

```typescript
// Good: Structured logging
await server.sendLoggingMessage({
  level: "error",
  logger: "database",
  data: {
    operation: "query",
    query: "SELECT * FROM users",
    error: error.message,
    duration: 1234
  }
});

// Less ideal: Unstructured string
await server.sendLoggingMessage({
  level: "error",
  data: `Database query failed: ${error.message}`
});
```

### 4. Handle Errors Gracefully

Never let unhandled console outputs escape:

```typescript
try {
  const result = await someOperation();
  await server.sendLoggingMessage({
    level: "info",
    data: { message: "Operation successful", result }
  });
} catch (error) {
  // Don't use console.error!
  await server.sendLoggingMessage({
    level: "error",
    data: {
      message: "Operation failed",
      error: error instanceof Error ? error.message : String(error)
    }
  });
}
```

### 5. Remove All Console Statements

Before deploying your MCP server, ensure you've removed or replaced all:
- `console.log()`
- `console.error()`
- `console.warn()`
- `console.debug()`
- `console.info()`

You can use a linter rule to enforce this:

```json
// .eslintrc.json
{
  "rules": {
    "no-console": "error"
  }
}
```

## Debugging During Development

If you need to debug during development, you have several options:

### Option 1: Write to a File

```typescript
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'debug.log');

function debugLog(message: string) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
}
```

### Option 2: Use the Debug Module

```typescript
import debug from 'debug';

const log = debug('mcp:server');
// Set DEBUG=mcp:* environment variable to enable
```

### Option 3: Use MCP Logging with Debug Level

```typescript
const DEBUG = process.env.MCP_DEBUG === 'true';

async function debugLog(server: Server, message: any) {
  if (DEBUG) {
    await server.sendLoggingMessage({
      level: "debug",
      data: message
    });
  }
}
```

## Client Considerations

Remember that logging messages are sent to the client, which decides how to handle them:
- Some clients may display logs in a console
- Some clients may write logs to a file
- Some clients may filter by log level
- The client controls the minimum log level via the `logging/setLevel` request

## Example: Converting Console Usage to MCP Logging

### Before (Incorrect):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    console.log(`Processing tool: ${request.params.name}`);
    const result = await processToolCall(request);
    console.log('Tool call successful');
    return result;
  } catch (error) {
    console.error('Tool call failed:', error);
    throw error;
  }
});
```

### After (Correct):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    await server.sendLoggingMessage({
      level: "debug",
      data: { message: "Processing tool", tool: request.params.name }
    });
    
    const result = await processToolCall(request);
    
    await server.sendLoggingMessage({
      level: "info",
      data: { message: "Tool call successful", tool: request.params.name }
    });
    
    return result;
  } catch (error) {
    await server.sendLoggingMessage({
      level: "error",
      data: {
        message: "Tool call failed",
        tool: request.params.name,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
});
```

## Summary

- **Never use console methods** in an MCP server with stdio transport
- **Always use `server.sendLoggingMessage()`** for logging
- **Enable the logging capability** in your server configuration
- **Use structured logging** with appropriate log levels
- **Handle all errors** to prevent unexpected console output
- **Test thoroughly** to ensure no console statements remain

By following these guidelines, your MCP server will maintain proper protocol communication while still providing valuable logging information to clients.