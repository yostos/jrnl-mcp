#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { JrnlExecutor } from "./utils/jrnlExecutor.js";
import { MCPLogger } from "./utils/logger.js";
import { searchEntries } from "./handlers/entryHandlers.js";
import { listTags, analyzeTagCooccurrence } from "./handlers/tagHandlers.js";
import { getStatistics } from "./handlers/statisticsHandlers.js";
import {
  listJournals,
  setJournal,
  getCurrentJournal,
} from "./handlers/journalHandlers.js";

const server = new Server(
  {
    name: "jrnl-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      logging: {}, // Enable logging capability
      tools: {},
    },
  },
);

const executor = new JrnlExecutor();
const logger = new MCPLogger(server);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  await logger.debug("Listing available tools", "tools");

  return {
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
              description:
                "Journal name (uses current/default if not specified)",
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
              description:
                "Journal name (uses current/default if not specified)",
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
              description:
                "Journal name (uses current/default if not specified)",
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
              description:
                "Journal name (uses current/default if not specified)",
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
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  await logger.logFunction(name, "enter", { arguments: args });

  try {
    const journal =
      (typeof args?.journal === "string" ? args.journal : undefined) ||
      getCurrentJournal();

    let result;

    switch (name) {
      case "search_entries":
        await logger.debug(
          {
            message: "Searching entries",
            filters: args,
            journal,
          },
          "search",
        );
        result = {
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
        break;

      case "list_tags":
        await logger.debug(
          {
            message: "Listing tags",
            journal,
          },
          "tags",
        );
        result = {
          content: [
            {
              type: "text",
              text: JSON.stringify(await listTags(journal, executor), null, 2),
            },
          ],
        };
        break;

      case "analyze_tag_cooccurrence":
        await logger.debug(
          {
            message: "Analyzing tag co-occurrence",
            tags: args?.tags,
            journal,
          },
          "tags",
        );
        result = {
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
        break;

      case "get_statistics":
        await logger.debug(
          {
            message: "Getting statistics",
            timeGrouping: args?.timeGrouping,
            journal,
          },
          "statistics",
        );
        result = {
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
        break;

      case "list_journals":
        await logger.debug("Listing journals", "journals");
        result = {
          content: [
            {
              type: "text",
              text: JSON.stringify(await listJournals(executor), null, 2),
            },
          ],
        };
        break;

      case "set_journal":
        await logger.info(
          {
            message: "Setting active journal",
            journal: args?.journalName,
          },
          "journals",
        );
        result = {
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
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    await logger.logFunction(name, "exit", { success: true });
    return result;
  } catch (error) {
    await logger.logFunction(name, "error", {
      error: logger.formatError(error),
    });

    // Return error to client without using console
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  try {
    await logger.info("Starting jrnl-mcp server", "startup");

    const transport = new StdioServerTransport();
    await server.connect(transport);

    await logger.info("Server connected successfully", "startup");
  } catch (error) {
    // Can't use logger here as server might not be initialized
    // Write to a file or use alternative logging mechanism
    process.exit(1);
  }
}

main().catch((error) => {
  // Server error - exit silently
  process.exit(1);
});
