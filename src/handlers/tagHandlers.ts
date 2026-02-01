import { JrnlExecutor } from "../utils/jrnlExecutor.js";
import {
  buildTagCommand,
  buildSearchCommand,
} from "../utils/commandBuilder.js";
import { JrnlExecutionError } from "../errors/index.js";
import { logDebug } from "../utils/logger.js";

export interface TagInfo {
  tag: string;
  count: number;
}

export interface TagCooccurrence {
  tag1: string;
  tag2: string;
  count: number;
}

export async function listTags(
  journal: string | undefined,
  executor: JrnlExecutor,
): Promise<{ tags: Record<string, number> }> {
  const command = buildTagCommand(journal);
  const result = await executor.execute(command);

  try {
    // Parse plain text format: "@tag : count"
    const tags: Record<string, number> = {};
    const lines = result.trim().split("\n");

    for (const line of lines) {
      const match = line.match(/^(@\w+)\s*:\s*(\d+)$/);
      if (match) {
        const [, tag, count] = match;
        tags[tag] = parseInt(count, 10);
      }
    }

    return { tags };
  } catch (error) {
    if (error instanceof JrnlExecutionError) {
      throw error;
    }
    throw new JrnlExecutionError(
      `Failed to parse jrnl tags output: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function analyzeTagCooccurrence(
  tags: string[],
  journal: string | undefined,
  executor: JrnlExecutor,
): Promise<{ cooccurrences: TagCooccurrence[] }> {
  if (tags.length < 2) {
    return { cooccurrences: [] };
  }

  // For each pair of tags, find entries that contain both
  const cooccurrences: TagCooccurrence[] = [];

  for (let i = 0; i < tags.length - 1; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const tag1 = tags[i];
      const tag2 = tags[j];

      // Search for entries with both tags
      const command = buildSearchCommand({ tags: [tag1, tag2] }, journal);
      const result = await executor.execute(command);

      try {
        const data = JSON.parse(result);
        const count = data.entries ? data.entries.length : 0;

        if (count > 0) {
          cooccurrences.push({
            tag1: tag1.startsWith("@") ? tag1 : `@${tag1}`,
            tag2: tag2.startsWith("@") ? tag2 : `@${tag2}`,
            count,
          });
        }
      } catch (error) {
        // Skip this pair if there's an error, but log for debugging
        logDebug(
          `Error analyzing cooccurrence for ${tag1} and ${tag2}: ${error}`,
          "analyzeTagCooccurrence",
        );
      }
    }
  }

  // Sort by count descending
  cooccurrences.sort((a, b) => b.count - a.count);

  return { cooccurrences };
}
