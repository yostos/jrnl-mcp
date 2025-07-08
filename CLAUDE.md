# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a jrnl MCP (Model Context Protocol) server that provides a read-only API for AI assistants to access and analyze journal entries from the jrnl command-line tool.

**Current State**: Fully implemented with comprehensive test coverage.

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
- Consider caching for performance with large journals

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

## Current Status (2025-07-01)

### Completed Tasks ✅
- ✅ 統合テストの追加と修正（search_entries、list_tags、get_statistics、analyze_tag_cooccurrence）
- ✅ 実装の修正（JSON/プレーンテキスト処理）
- ✅ デバッグログの削除とstderrへの適切なログ出力
- ✅ コードフォーマットとlintの実行
- ✅ npm linkでグローバルインストール
- ✅ すべてのテストが通ることを確認

### Resolved Issue ✅
**Claude Desktop接続エラー (2025-07-07)**
- 症状: Claude Desktop起動時に "MCP jrnl:write EPIPE" エラー
- 原因: グローバルインストールされた`jrnl-mcp`のシェバング行が`#!/usr/bin/env node`を使用していたが、Claude DesktopのPATH環境変数にNode.jsが含まれていなかった
- 解決策: シェバング行をNode.jsの絶対パスに変更（環境依存の一時的な修正）
- 注意: この修正は環境依存なので、将来的にはClaude DesktopのPATH設定改善が望ましい

### File Locations
- Global command: `<npm-global-bin>/jrnl-mcp` (e.g., /opt/homebrew/bin/jrnl-mcp on macOS with Homebrew)
- Project: `<project-directory>` (wherever you cloned this repository)
- Config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)