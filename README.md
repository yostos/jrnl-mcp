# jrnl MCP Server

A Model Context Protocol (MCP) server that provides read-only access to jrnl (command-line journal) entries.

## Prerequisites

- Node.js 18 or higher
- jrnl installed and configured (`pip install jrnl`)

## Installation

```bash
npm install
npm run build
npm link  # Install globally as jrnl-mcp command
```

## Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

### macOS
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Configuration

```json
{
  "mcpServers": {
    "jrnl": {
      "command": "jrnl-mcp"
    }
  }
}
```

Note: If you installed via `npm link`, the command will be globally available.
For local development without global installation, use:

```json
{
  "mcpServers": {
    "jrnl": {
      "command": "node",
      "args": ["<path-to-project>/dist/index.js"]
    }
  }
}
```

## Available Tools

- **search_entries** - Search journal entries with filters
- **list_tags** - List all tags with usage counts
- **get_statistics** - Get journal statistics
- **analyze_tag_cooccurrence** - Analyze tag co-occurrences
- **list_journals** - List available journals
- **set_journal** - Switch to a different journal

## Development

```bash
npm run format  # Format code
npm run lint    # Run linter
npm test        # Run tests
npm run build   # Build for production
```

## Testing with Claude Desktop

1. Build the project: `npm run build`
2. Update your Claude Desktop config with the correct path
3. Restart Claude Desktop
4. Test by asking Claude to search your journal entries

Example prompts:
- "Show me my journal entries from last week"
- "What tags am I using in my journal?"
- "Show me statistics about my journal"