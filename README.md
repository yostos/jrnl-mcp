# jrnl MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Claude](https://img.shields.io/badge/Claude-MCP-blue)](https://claude.ai)
[![jrnl](https://img.shields.io/badge/jrnl-CLI-orange)](https://jrnl.sh/)

A Model Context Protocol (MCP) server that provides read-only access to jrnl (command-line journal) entries.

<a href="https://glama.ai/mcp/servers/@yostos/jrnl-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@yostos/jrnl-mcp/badge" alt="jrnl Server MCP server" />
</a>

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
- "Use jrnl to show me my journal entries from last week"
- "Using jrnl, what tags am I using in my journal?"
- "Can you use jrnl to show me statistics about my journal?"
- "Search my journal entries for entries tagged with @work using jrnl"