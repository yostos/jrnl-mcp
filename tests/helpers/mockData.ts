/**
 * Mock data helpers for testing
 */

import * as fs from "fs";
import * as path from "path";

export interface MockEntry {
  date: string;
  time: string;
  title: string;
  body: string;
  tags: string[];
  starred: boolean;
}

export interface MockJrnlOutput {
  tags: Record<string, number>;
  entries: MockEntry[];
}

/**
 * Load sample entries from fixtures
 */
export function loadSampleEntries(): MockJrnlOutput {
  const fixturesPath = path.join(__dirname, "../fixtures/sample-entries.json");
  const data = fs.readFileSync(fixturesPath, "utf-8");
  return JSON.parse(data) as MockJrnlOutput;
}

/**
 * Create a mock entry with default values
 */
export function createMockEntry(overrides: Partial<MockEntry> = {}): MockEntry {
  return {
    date: "2024-01-01",
    time: "12:00",
    title: "Test entry",
    body: "This is a test entry body.",
    tags: ["@test"],
    starred: false,
    ...overrides,
  };
}

/**
 * Create mock jrnl output with specified number of entries
 */
export function createMockJrnlOutput(
  entryCount: number,
  options: { starred?: boolean; tags?: string[] } = {},
): MockJrnlOutput {
  const entries: MockEntry[] = [];
  const tagCounts: Record<string, number> = {};

  for (let i = 0; i < entryCount; i++) {
    const date = new Date(2024, 0, i + 1);
    const tags = options.tags || ["@test"];

    const entry = createMockEntry({
      date: date.toISOString().split("T")[0],
      time: `${String(9 + (i % 12)).padStart(2, "0")}:00`,
      title: `Entry ${i + 1}`,
      body: `This is entry number ${i + 1}.`,
      tags,
      starred: options.starred ?? i % 3 === 0,
    });

    entries.push(entry);

    // Count tags
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  }

  return { tags: tagCounts, entries };
}

/**
 * Create empty jrnl output (no entries found)
 */
export function createEmptyJrnlOutput(): MockJrnlOutput {
  return { tags: {}, entries: [] };
}

/**
 * Filter entries by date range
 */
export function filterByDateRange(
  output: MockJrnlOutput,
  from?: string,
  to?: string,
): MockJrnlOutput {
  let entries = output.entries;

  if (from) {
    entries = entries.filter((e) => e.date >= from);
  }
  if (to) {
    entries = entries.filter((e) => e.date <= to);
  }

  return { tags: output.tags, entries };
}

/**
 * Filter entries by tags
 */
export function filterByTags(
  output: MockJrnlOutput,
  tags: string[],
): MockJrnlOutput {
  const normalizedTags = tags.map((t) => (t.startsWith("@") ? t : `@${t}`));
  const entries = output.entries.filter((e) =>
    normalizedTags.every((tag) => e.tags.includes(tag)),
  );

  return { tags: output.tags, entries };
}

/**
 * Filter starred entries
 */
export function filterStarred(output: MockJrnlOutput): MockJrnlOutput {
  const entries = output.entries.filter((e) => e.starred);
  return { tags: output.tags, entries };
}
