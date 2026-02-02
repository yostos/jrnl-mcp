#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { JrnlExecutor } from "./utils/jrnlExecutor.js";
import { searchEntries } from "./handlers/entryHandlers.js";
import { listTags, analyzeTagCooccurrence } from "./handlers/tagHandlers.js";
import { getStatistics } from "./handlers/statisticsHandlers.js";
import {
  listJournals,
  setJournal,
  getCurrentJournal,
} from "./handlers/journalHandlers.js";
import { logError, logInfo } from "./utils/logger.js";
import { JrnlMcpError } from "./errors/index.js";

const server = new Server(
  {
    name: "jrnl-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const executor = new JrnlExecutor();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_entries",
      description: "Search and filter journal entries",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: 'Start date (e.g., "yesterday", "2024-01-01")',
          },
          to: { type: "string", description: "End date" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags to filter by",
          },
          contains: { type: "string", description: "Text to search for" },
          limit: { type: "number", description: "Maximum number of entries" },
          starred: {
            type: "boolean",
            description: "Only show starred entries",
          },
          journal: {
            type: "string",
            description: "Journal name (uses current/default if not specified)",
          },
        },
      },
    },
    {
      name: "list_tags",
      description: "List all tags with their usage counts",
      inputSchema: {
        type: "object",
        properties: {
          journal: {
            type: "string",
            description: "Journal name (uses current/default if not specified)",
          },
        },
      },
    },
    {
      name: "analyze_tag_cooccurrence",
      description: "Analyze which tags frequently appear together",
      inputSchema: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags to analyze for co-occurrence",
            minItems: 2,
          },
          journal: {
            type: "string",
            description: "Journal name (uses current/default if not specified)",
          },
        },
        required: ["tags"],
      },
    },
    {
      name: "get_statistics",
      description: "Get journal statistics and analytics",
      inputSchema: {
        type: "object",
        properties: {
          journal: {
            type: "string",
            description: "Journal name (uses current/default if not specified)",
          },
          timeGrouping: {
            type: "string",
            enum: ["day", "week", "month", "year"],
            description: "Group statistics by time period",
          },
          includeTopTags: {
            type: "boolean",
            description: "Include top tags in statistics",
          },
        },
      },
    },
    {
      name: "list_journals",
      description: "List all available journals",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "set_journal",
      description: "Set the active journal for subsequent operations",
      inputSchema: {
        type: "object",
        properties: {
          journalName: {
            type: "string",
            description: "Name of the journal to set as active",
          },
        },
        required: ["journalName"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const journal =
      (typeof args?.journal === "string" ? args.journal : undefined) ||
      getCurrentJournal();

    switch (name) {
      case "search_entries":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await searchEntries({ ...args, journal } as any, executor),
                null,
                2,
              ),
            },
          ],
        };

      case "list_tags":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await listTags(journal, executor), null, 2),
            },
          ],
        };

      case "analyze_tag_cooccurrence":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await analyzeTagCooccurrence(
                  Array.isArray(args?.tags) ? args.tags : [],
                  journal,
                  executor,
                ),
                null,
                2,
              ),
            },
          ],
        };

      case "get_statistics":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await getStatistics(
                  journal,
                  typeof args?.timeGrouping === "string"
                    ? args.timeGrouping
                    : undefined,
                  typeof args?.includeTopTags === "boolean"
                    ? args.includeTopTags
                    : true,
                  executor,
                ),
                null,
                2,
              ),
            },
          ],
        };

      case "list_journals":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await listJournals(executor), null, 2),
            },
          ],
        };

      case "set_journal":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await setJournal(
                  typeof args?.journalName === "string" ? args.journalName : "",
                ),
                null,
                2,
              ),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logError(error, `tool:${name}`);

    // Provide user-friendly error messages based on error type
    let errorMessage: string;
    if (error instanceof JrnlMcpError) {
      errorMessage = `${error.code}: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logInfo("jrnl MCP server started", "main");
  } catch (error) {
    logError(error, "main:startup");
    process.exit(1);
  }
}

main().catch((error) => {
  logError(error, "main:unhandled");
  process.exit(1);
});
