# MCP Server Logging Functionality Analysis

## Summary

I've analyzed the `@modelcontextprotocol/sdk` package to understand the proper way to implement logging in an MCP server without breaking the stdio transport. Here are the key findings and recommendations:

## Current State of jrnl-mcp

✅ **Good News**: The current jrnl-mcp server implementation is already safe for stdio transport:
- No active `console.*` statements found
- The only console statement in `src/handlers/tagHandlers.ts:75` is already commented out
- Error handling properly returns error messages through the MCP protocol

## Key Findings from SDK Analysis

### 1. MCP Logging Capability
The MCP protocol includes built-in logging support through:
- **Server capability**: `logging: {}` in server capabilities
- **Method**: `server.sendLoggingMessage()` for sending log messages
- **Notification type**: `notifications/message` with structured log data

### 2. Proper Log Levels
MCP supports 8 log levels (from least to most severe):
- `debug` - Detailed debugging information
- `info` - General informational messages  
- `notice` - Normal but significant conditions
- `warning` - Warning conditions
- `error` - Error conditions
- `critical` - Critical conditions
- `alert` - Action must be taken immediately
- `emergency` - System is unusable

### 3. Logging Message Structure
```typescript
await server.sendLoggingMessage({
  level: "info",          // Required: log level
  data: "message or object", // Required: any JSON-serializable data
  logger: "component-name"   // Optional: logger name
});
```

## Files Created

1. **`docs/MCP_LOGGING_GUIDE.md`** - Comprehensive guide on MCP logging
2. **`src/utils/logger.ts`** - MCPLogger utility class for structured logging
3. **`src/index-with-logging.ts`** - Example server implementation with proper logging
4. **`scripts/check-console-usage.js`** - Script to detect problematic console usage
5. **`LOGGING_ANALYSIS.md`** - This analysis document

## Recommendations

### For Current jrnl-mcp Server
The current implementation is already safe, but to add proper logging:

1. **Enable logging capability**:
   ```typescript
   const server = new Server({...}, {
     capabilities: {
       logging: {},  // Add this
       tools: {}
     }
   });
   ```

2. **Use the MCPLogger utility** (optional enhancement):
   ```typescript
   import { MCPLogger } from "./utils/logger.js";
   const logger = new MCPLogger(server);
   
   // Instead of silent errors, log them:
   await logger.error({ message: "Operation failed", error: error.message });
   ```

### For Future Development
- Always use `server.sendLoggingMessage()` instead of `console.*`
- Use the provided `check-console-usage.js` script in CI/CD
- Structure log data as objects for better debugging
- Use appropriate log levels for different scenarios

## Why This Matters

MCP servers using stdio transport communicate over stdin/stdout:
- `console.log()` writes to stdout → breaks JSON-RPC protocol
- `console.error()` writes to stderr → can cause client disconnection
- Any unexpected output → protocol violation

The MCP logging system sends log messages as proper protocol notifications that clients can handle appropriately (display in UI, write to files, filter by level, etc.).

## Implementation Examples

### Basic Usage
```typescript
await server.sendLoggingMessage({
  level: "info",
  data: "Server initialized successfully"
});
```

### Structured Logging
```typescript
await server.sendLoggingMessage({
  level: "error",
  logger: "database",
  data: {
    operation: "query",
    error: error.message,
    duration: 1234
  }
});
```

### Using MCPLogger Utility
```typescript
const logger = new MCPLogger(server);
await logger.info("Operation completed", "component-name");
await logger.error(logger.formatError(error), "error-handler");
```

The jrnl-mcp server is already well-implemented with proper error handling. Adding the logging capability would enhance debugging and monitoring capabilities without any risk to protocol stability.