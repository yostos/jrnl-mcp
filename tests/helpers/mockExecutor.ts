/**
 * Mock JrnlExecutor for testing without real jrnl installation
 */

import { loadSampleEntries, MockJrnlOutput } from "./mockData";

export class MockJrnlExecutor {
  private mockData: MockJrnlOutput;
  private journals: string[] = ["default", "work", "personal"];
  private currentJournal: string = "default";

  constructor() {
    this.mockData = loadSampleEntries();
  }

  async execute(args: string[]): Promise<string> {
    // Handle --version
    if (args.includes("--version")) {
      return "jrnl version 4.2 (mock)";
    }

    // Handle --list (list journals)
    if (args.includes("--list")) {
      return this.journals.join("\n");
    }

    // Handle --export json (entries search)
    if (args.includes("--export") && args.includes("json")) {
      return this.handleSearch(args);
    }

    // Handle --tags (list tags)
    if (args.includes("--tags")) {
      return this.handleTags();
    }

    // Default: return mock entries
    return JSON.stringify(this.mockData);
  }

  private handleSearch(args: string[]): string {
    let filteredEntries = [...this.mockData.entries];

    // Handle tag filtering
    const tagIndex = args.findIndex((a) => a.startsWith("@"));
    if (tagIndex !== -1) {
      const tags = args.filter((a) => a.startsWith("@"));
      filteredEntries = filteredEntries.filter((entry) =>
        tags.some((tag) => entry.tags.includes(tag)),
      );
    }

    // Handle -starred
    if (args.includes("-starred")) {
      filteredEntries = filteredEntries.filter((entry) => entry.starred);
    }

    // Handle -n (limit)
    const nIndex = args.indexOf("-n");
    if (nIndex !== -1 && args[nIndex + 1]) {
      const limit = parseInt(args[nIndex + 1], 10);
      filteredEntries = filteredEntries.slice(0, limit);
    }

    // Handle -contains
    const containsIndex = args.indexOf("-contains");
    if (containsIndex !== -1 && args[containsIndex + 1]) {
      const searchText = args[containsIndex + 1].toLowerCase();
      filteredEntries = filteredEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchText) ||
          entry.body.toLowerCase().includes(searchText),
      );
    }

    // Recalculate tag counts for filtered entries
    const tags: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return JSON.stringify({ tags, entries: filteredEntries });
  }

  private handleTags(): string {
    // Return tags in jrnl format: tag : count
    return Object.entries(this.mockData.tags)
      .map(([tag, count]) => `${tag} : ${count}`)
      .join("\n");
  }

  setJournal(journal: string): void {
    if (this.journals.includes(journal)) {
      this.currentJournal = journal;
    }
  }

  getJournals(): string[] {
    return this.journals;
  }
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return process.env.JRNL_MCP_USE_MOCK === "true";
}
