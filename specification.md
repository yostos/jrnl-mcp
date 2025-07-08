# jrnl MCP Server Specification

## Overview

This MCP (Model Context Protocol) server provides read-only access to jrnl (command-line journal application) functionality. It enables AI assistants to search, filter, and analyze journal entries without modifying them.

## Core Principles

- **Read-only access**: No write, update, or delete operations
- **Leverage jrnl CLI**: Utilize jrnl's powerful command-line interface
- **Structured output**: All responses in JSON format for easy parsing
- **Flexible filtering**: Support jrnl's natural language date parsing and tag system

## API Functions

### 1. Entry Search and Retrieval

#### `search_entries`
Search and filter journal entries with various criteria.

**Parameters:**
```typescript
{
  from?: string,        // Start date (e.g., "last year", "2023-01-01", "yesterday")
  until?: string,       // End date (same format as from)
  on?: string,          // Specific date
  tags?: string[],      // Tag filters (e.g., ["@work", "@meeting"])
  contains?: string,    // Text search within entries
  starred?: boolean,    // Only starred entries
  limit?: number,       // Maximum number of entries to return
  and_tags?: boolean    // AND logic for tags (default: false = OR logic)
}
```

**Returns:**
```typescript
{
  entries: Array<{
    date: string,       // ISO format datetime
    title: string,      // Entry title/first line
    body: string,       // Full entry content
    tags: string[],     // All tags in the entry
    starred: boolean    // Whether entry is starred
  }>
}
```

### 2. Tag Management and Analysis

#### `list_tags`
Get all tags with their usage counts.

**Parameters:**
```typescript
{
  from?: string,        // Filter by start date
  until?: string        // Filter by end date
}
```

**Returns:**
```typescript
{
  tags: Array<{
    name: string,       // Tag name (e.g., "@work")
    count: number       // Number of entries with this tag
  }>
}
```

#### `analyze_tag_cooccurrence`
Analyze which tags appear together with a primary tag.

**Parameters:**
```typescript
{
  primary_tag: string,  // The tag to analyze (e.g., "@meeting")
  from?: string,        // Filter by start date
  until?: string        // Filter by end date
}
```

**Returns:**
```typescript
{
  primary_tag: string,
  cooccurrences: Array<{
    tag: string,        // Co-occurring tag
    count: number       // Number of entries where both tags appear
  }>
}
```

### 3. Statistics and Analytics

#### `get_statistics`
Get statistical information about journal entries.

**Parameters:**
```typescript
{
  from?: string,        // Start date for analysis
  until?: string,       // End date for analysis
  group_by?: "day" | "week" | "month" | "year"  // Grouping granularity
}
```

**Returns:**
```typescript
{
  total_entries: number,
  total_words: number,
  average_words_per_entry: number,
  entries_by_period?: Array<{
    period: string,     // e.g., "2024-01", "Week 23", etc.
    entry_count: number,
    word_count: number
  }>,
  most_used_tags: Array<{
    tag: string,
    count: number
  }>
}
```

### 4. Journal Management

#### `list_journals`
List all available journals configured in jrnl.

**Parameters:** None

**Returns:**
```typescript
{
  journals: string[],   // Array of journal names
  current: string       // Currently active journal
}
```

#### `set_journal`
Switch to a different journal for subsequent operations.

**Parameters:**
```typescript
{
  name: string         // Journal name to switch to
}
```

**Returns:**
```typescript
{
  success: boolean,
  message: string
}
```

## Implementation Notes

### Date Parsing
The server should support jrnl's flexible date parsing, including:
- Natural language: "yesterday", "last monday", "3 days ago"
- Absolute dates: "2024-01-15", "jan 15 2024"
- Time specifications: "today at 3pm", "yesterday at noon"

### Command Mapping
Map API calls to jrnl CLI commands:
- `search_entries` → `jrnl [date filters] [tag filters] --export json`
- `list_tags` → `jrnl [date filters] --tags`
- `get_statistics` → Combination of `jrnl --export json` and data processing

### Error Handling
- Return appropriate error messages for:
  - Invalid date formats
  - Non-existent journals
  - Empty results
  - jrnl command failures

### Performance Considerations
- Implement result caching where appropriate
- Use `--limit` flag for large journals
- Stream large results if needed

## Usage Examples

```javascript
// Search for work-related entries from last week
await search_entries({
  from: "last week",
  tags: ["@work"],
  limit: 10
});

// Analyze meeting tag associations
await analyze_tag_cooccurrence({
  primary_tag: "@meeting",
  from: "2024-01-01"
});

// Get monthly statistics for the year
await get_statistics({
  from: "2024-01-01",
  until: "2024-12-31",
  group_by: "month"
});
```

## Security Considerations

- Never execute write operations (`jrnl "new entry"`, `--edit`, `--delete`)
- Validate all input parameters to prevent command injection
- Respect jrnl's encryption if configured
- Do not expose file paths or system information
