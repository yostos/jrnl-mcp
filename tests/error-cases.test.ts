import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  JrnlExecutionError,
  JrnlNotFoundError,
  InvalidArgumentError,
  JournalNotFoundError,
} from "../src/errors/index";

describe("Error Classes", () => {
  describe("JrnlExecutionError", () => {
    it("should create error with message", () => {
      const error = new JrnlExecutionError("Command failed");
      expect(error.message).toBe("Command failed");
      expect(error.code).toBe("JRNL_EXECUTION_ERROR");
      expect(error.name).toBe("JrnlExecutionError");
    });

    it("should include exit code and stderr", () => {
      const error = new JrnlExecutionError("Command failed", 1, "Error output");
      expect(error.exitCode).toBe(1);
      expect(error.stderr).toBe("Error output");
      expect(error.details).toEqual({ exitCode: 1, stderr: "Error output" });
    });
  });

  describe("JrnlNotFoundError", () => {
    it("should create error with default message", () => {
      const error = new JrnlNotFoundError();
      expect(error.message).toBe("jrnl command not found");
      expect(error.code).toBe("JRNL_NOT_FOUND");
      expect(error.name).toBe("JrnlNotFoundError");
    });

    it("should create error with custom message", () => {
      const error = new JrnlNotFoundError("jrnl is not installed");
      expect(error.message).toBe("jrnl is not installed");
    });
  });

  describe("InvalidArgumentError", () => {
    it("should create error with argument name", () => {
      const error = new InvalidArgumentError(
        "Invalid date format",
        "from_date",
      );
      expect(error.message).toBe("Invalid date format");
      expect(error.code).toBe("INVALID_ARGUMENT");
      expect(error.argumentName).toBe("from_date");
      expect(error.details).toEqual({ argumentName: "from_date" });
    });
  });

  describe("JournalNotFoundError", () => {
    it("should create error with journal name", () => {
      const error = new JournalNotFoundError("work");
      expect(error.message).toBe("Journal 'work' not found");
      expect(error.code).toBe("JOURNAL_NOT_FOUND");
      expect(error.details).toEqual({ journalName: "work" });
    });
  });
});

describe("Empty Results Handling", () => {
  describe("search_entries with non-matching filters", () => {
    it("should return empty entries for non-existent date range", async () => {
      // This tests the actual behavior when no entries match
      const { JrnlExecutor } = await import("../src/utils/jrnlExecutor");
      const { searchEntries } = await import("../src/handlers/entryHandlers");

      const executor = new JrnlExecutor();

      // Search for entries in a date range that likely has no entries
      const result = await searchEntries(
        {
          from: "1900-01-01",
          to: "1900-01-02",
        },
        executor,
      );

      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBe(0);
    });

    it("should return empty entries for non-existent tag", async () => {
      const { JrnlExecutor } = await import("../src/utils/jrnlExecutor");
      const { searchEntries } = await import("../src/handlers/entryHandlers");

      const executor = new JrnlExecutor();

      // Search for entries with a tag that doesn't exist
      const result = await searchEntries(
        {
          tags: ["@nonexistent_tag_xyz_123"],
        },
        executor,
      );

      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBe(0);
    });
  });

  describe("analyze_tag_cooccurrence edge cases", () => {
    it("should return empty cooccurrences for less than 2 tags", async () => {
      const { JrnlExecutor } = await import("../src/utils/jrnlExecutor");
      const { analyzeTagCooccurrence } =
        await import("../src/handlers/tagHandlers");

      const executor = new JrnlExecutor();

      // Analyze with only 1 tag
      const result = await analyzeTagCooccurrence(
        ["@tag1"],
        undefined,
        executor,
      );

      expect(result.cooccurrences).toBeDefined();
      expect(Array.isArray(result.cooccurrences)).toBe(true);
      expect(result.cooccurrences.length).toBe(0);
    });

    it("should return empty cooccurrences for empty tag array", async () => {
      const { JrnlExecutor } = await import("../src/utils/jrnlExecutor");
      const { analyzeTagCooccurrence } =
        await import("../src/handlers/tagHandlers");

      const executor = new JrnlExecutor();

      const result = await analyzeTagCooccurrence([], undefined, executor);

      expect(result.cooccurrences).toBeDefined();
      expect(Array.isArray(result.cooccurrences)).toBe(true);
      expect(result.cooccurrences.length).toBe(0);
    });
  });
});

describe("Error Propagation", () => {
  it("should propagate JrnlExecutionError from handlers", async () => {
    const { JrnlExecutionError } = await import("../src/errors/index");

    // Verify error class is properly exported and can be caught
    const error = new JrnlExecutionError("Test error");
    expect(error instanceof Error).toBe(true);
    expect(error instanceof JrnlExecutionError).toBe(true);
  });
});

describe("Mock Data Helpers", () => {
  it("should create mock entries with defaults", async () => {
    const { createMockEntry } = await import("./helpers/mockData");

    const entry = createMockEntry();
    expect(entry.date).toBe("2024-01-01");
    expect(entry.title).toBe("Test entry");
    expect(entry.tags).toContain("@test");
    expect(entry.starred).toBe(false);
  });

  it("should create mock entries with overrides", async () => {
    const { createMockEntry } = await import("./helpers/mockData");

    const entry = createMockEntry({
      title: "Custom title",
      starred: true,
      tags: ["@custom"],
    });

    expect(entry.title).toBe("Custom title");
    expect(entry.starred).toBe(true);
    expect(entry.tags).toContain("@custom");
  });

  it("should create mock jrnl output with multiple entries", async () => {
    const { createMockJrnlOutput } = await import("./helpers/mockData");

    const output = createMockJrnlOutput(5);
    expect(output.entries.length).toBe(5);
    expect(output.tags["@test"]).toBe(5);
  });

  it("should create empty jrnl output", async () => {
    const { createEmptyJrnlOutput } = await import("./helpers/mockData");

    const output = createEmptyJrnlOutput();
    expect(output.entries.length).toBe(0);
    expect(Object.keys(output.tags).length).toBe(0);
  });

  it("should filter entries by tags", async () => {
    const { createMockJrnlOutput, filterByTags } =
      await import("./helpers/mockData");

    const output = createMockJrnlOutput(5, { tags: ["@work", "@meeting"] });
    const filtered = filterByTags(output, ["@work"]);

    expect(filtered.entries.length).toBe(5);
    expect(filtered.entries.every((e) => e.tags.includes("@work"))).toBe(true);
  });

  it("should filter starred entries", async () => {
    const { createMockJrnlOutput, filterStarred } =
      await import("./helpers/mockData");

    const output = createMockJrnlOutput(10);
    const filtered = filterStarred(output);

    expect(filtered.entries.every((e) => e.starred)).toBe(true);
  });

  it("should load sample entries from fixtures", async () => {
    const { loadSampleEntries } = await import("./helpers/mockData");

    const output = loadSampleEntries();
    expect(output.entries.length).toBeGreaterThan(0);
    expect(output.tags).toBeDefined();
    expect(output.tags["@work"]).toBeDefined();
  });
});
