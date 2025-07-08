# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-07-08

### Added
- Initial release of jrnl MCP server
- Complete implementation of Model Context Protocol for jrnl CLI
- Six main tools for journal interaction:
  - `search_entries` - Search and filter journal entries with date/tag/text criteria
  - `list_tags` - Get all tags with usage counts
  - `analyze_tag_cooccurrence` - Analyze which tags appear together
  - `get_statistics` - Get analytics (word counts, temporal grouping, top tags)
  - `list_journals` - List available journals
  - `set_journal` - Switch active journal
- TypeScript implementation with comprehensive type definitions
- Full test coverage with unit and integration tests
- Claude Desktop integration support
- Global installation via npm link
- Read-only safety guarantees with input validation
- Support for jrnl's natural language date parsing
- JSON export format for structured data
- Development tooling configuration (ESLint, Prettier, Jest)
- Documentation including README.md and CLAUDE.md

### Security
- Read-only access enforcement - no write operations allowed
- Input validation to prevent command injection
- No exposure of file paths or system information

[Unreleased]: https://github.com/yostos/jrnl-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yostos/jrnl-mcp/releases/tag/v1.0.0