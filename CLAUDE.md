# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 Work Tracking - START HERE

**IMPORTANT**: Before starting any work, check these documents in order:

1. **`docs/roadmap.md`** - 3-phase improvement plan (Phase 1 → Phase 2 → Phase 3)
   - Overview of all planned improvements
   - Categorized by priority (high/medium/low)
   - Helps understand the big picture

2. **`docs/todo.md`** - Detailed Phase 1 tasks with work logs
   - **Most important for day-to-day work**
   - Detailed task breakdowns with checkboxes
   - Work logs with timestamps and results
   - Next person reads this to continue work

3. **This file (CLAUDE.md)** - Project overview and guidelines
   - Architecture and implementation requirements
   - Development guidelines and best practices

---

## Git Workflow - MUST READ

**CRITICAL**: The `main` branch is protected. Direct pushes are blocked.

### Before ANY Git Operation

```bash
git branch  # Always check current branch first
```

### Required Workflow

```
develop (work here) → PR → main (protected)
```

1. **Always work on `develop` branch**
   ```bash
   git checkout develop
   ```

2. **Commit and push to develop**
   ```bash
   git add <files>
   git commit -m "message"
   git push origin develop
   ```

3. **Create PR to merge into main**
   ```bash
   gh pr create --base main --head develop
   ```

4. **Never commit directly to main** - It will be rejected by branch protection rules.

### If You Accidentally Commit to Main

```bash
# Cherry-pick to develop
git checkout develop
git cherry-pick <commit-hash>
git push origin develop

# Reset main to remote
git checkout main
git reset --hard origin/main
```

---

## Project Overview

This is a jrnl MCP (Model Context Protocol) server that provides a read-only API for AI assistants to access and analyze journal entries from the jrnl command-line tool.

**Current State**: Phase 1 improvements in progress (see `docs/todo.md` for details).

## Architecture

The proposed MCP server follows these key patterns:

- **Read-Only Proxy**: Acts as a safe proxy to the jrnl CLI tool, preventing any write operations
- **Command Mapping**: Translates API calls to jrnl CLI commands (e.g., `search_entries` → `jrnl [filters] --export json`)
- **Structured Responses**: All data returned in JSON format with TypeScript type definitions
- **Flexible Querying**: Supports jrnl's natural language date parsing and tag filtering with AND/OR logic

## API Structure

The specification defines 6 main functions:
1. `search_entries` - Search and filter journal entries with date/tag/text criteria
2. `list_tags` - Get all tags with usage counts
3. `analyze_tag_cooccurrence` - Analyze which tags appear together
4. `get_statistics` - Get analytics (word counts, temporal grouping, top tags)
5. `list_journals` - List available journals
6. `set_journal` - Switch active journal

## Implementation Requirements

When implementing this specification:

- Use jrnl CLI with `--export json` for structured data
- Support jrnl's flexible date parsing ("yesterday", "last monday", "3 days ago")
- Implement input validation to prevent command injection
- Never allow write operations to maintain data safety
- Handle jrnl encryption transparently
- Caching was considered but rejected (see ADR-002)

## Security Constraints

- **Read-only access only** - never implement write, edit, or delete operations
- Validate all input parameters to prevent command injection
- Do not expose file paths or system information
- Respect jrnl's encryption if configured

## Development Notes

- Build system: TypeScript with Jest for testing
- Runtime: Node.js with MCP SDK
- External dependency: jrnl CLI tool must be installed and configured
- Code quality tools: ESLint and Prettier are configured

## Code Quality Commands

When making changes, always run these commands in order:
1. `npm run format` - Format code with Prettier
2. `npm run lint` - Check code with ESLint  
3. `npm run test` - Run all tests

## Important Guidelines

### Environment Compatibility
- NEVER hardcode absolute paths (especially for Node.js executables)
- Always write code that works across different environments
- Use standard commands like `node` rather than absolute paths
- For shebang lines in globally installed scripts, use `#!/usr/bin/env node`

### Testing Considerations
- Integration tests spawn the MCP server using `node dist/index.js`
- The server outputs "jrnl MCP server started" to stderr when ready
- Tests wait for this specific message to know the server is ready

## Testing

- Unit tests: Test individual functions and utilities
- Integration tests: Test MCP protocol communication and tool execution
- All tests must pass before committing changes

## Current Status (2026-02-02)

**Phase 1**: ✅ **COMPLETED** (2026-02-01)
**Phase 2**: ✅ **COMPLETED** (2026-02-02)

✅ **Completed (Phase 2)**:
1. Jest 30 upgrade (29.7.0 → 30.2.0)
2. ESLint 9 upgrade (Flat Config migration)
3. Architecture documentation (`docs/ARCHITECTURE.md`)

**Decisions** (see `docs/ARCHITECTURE_DECISIONS.md`):
- Caching → Rejected (ADR-002)
- ESModules migration → Rejected (ADR-003)
- Documentation & DX → Deferred (ADR-004)

🚧 **Next**: Phase 3 (see `docs/roadmap.md`)

---

## Historical Completed Tasks (2025-07-01 - 2025-07-08)

### Initial Implementation ✅
- Integration tests added and fixed (search_entries, list_tags, get_statistics, analyze_tag_cooccurrence)
- Implementation fixes (JSON/plain text processing)
- Debug logging cleanup and proper stderr output
- Code formatting and linting
- Global installation via npm link
- All tests passing

### Resolved Issue ✅
**Claude Desktop Connection Error (2025-07-07)**
- Symptom: "MCP jrnl:write EPIPE" error on Claude Desktop startup
- Cause: Global `jrnl-mcp` used `#!/usr/bin/env node` shebang, but Claude Desktop's PATH didn't include Node.js
- Solution: Changed shebang to absolute Node.js path (environment-specific temporary fix)
- Note: This is environment-dependent; ideally Claude Desktop's PATH should be improved

### File Locations
- Global command: `<npm-global-bin>/jrnl-mcp` (e.g., /opt/homebrew/bin/jrnl-mcp on macOS with Homebrew)
- Project: `<project-directory>` (wherever you cloned this repository)
- Config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)