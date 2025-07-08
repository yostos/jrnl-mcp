import { describe, it, expect } from "@jest/globals";
import { formatDateForJrnl, parseTimeGrouping } from "../src/utils/dateUtils";
import {
  buildSearchCommand,
  buildTagCommand,
  buildListJournalsCommand,
} from "../src/utils/commandBuilder";

describe("Unit Tests", () => {
  describe("dateUtils", () => {
    describe("formatDateForJrnl", () => {
      it("should pass through date strings", () => {
        expect(formatDateForJrnl("yesterday")).toBe("yesterday");
        expect(formatDateForJrnl("2024-01-01")).toBe("2024-01-01");
        expect(formatDateForJrnl("last week")).toBe("last week");
      });

      it("should return undefined for undefined input", () => {
        expect(formatDateForJrnl(undefined)).toBeUndefined();
      });
    });

    describe("parseTimeGrouping", () => {
      it("should map time groupings correctly", () => {
        expect(parseTimeGrouping("day")).toBe("daily");
        expect(parseTimeGrouping("week")).toBe("weekly");
        expect(parseTimeGrouping("month")).toBe("monthly");
        expect(parseTimeGrouping("year")).toBe("yearly");
      });

      it("should default to daily for unknown groupings", () => {
        expect(parseTimeGrouping("unknown")).toBe("daily");
      });
    });
  });

  describe("commandBuilder", () => {
    describe("buildSearchCommand", () => {
      it("should build basic search command", () => {
        const command = buildSearchCommand({});
        expect(command).toEqual(["--export", "json"]);
      });

      it("should add journal parameter", () => {
        const command = buildSearchCommand({}, "work");
        expect(command).toEqual(["work", "--export", "json"]);
      });

      it("should add date filters", () => {
        const command = buildSearchCommand({ from: "yesterday", to: "today" });
        expect(command).toContain("-from");
        expect(command).toContain("yesterday");
        expect(command).toContain("-to");
        expect(command).toContain("today");
      });

      it("should add tag filters", () => {
        const command = buildSearchCommand({ tags: ["work", "@personal"] });
        expect(command).toContain("@work");
        expect(command).toContain("@personal");
      });

      it("should add contains filter", () => {
        const command = buildSearchCommand({ contains: "meeting" });
        expect(command).toContain("-contains");
        expect(command).toContain("meeting");
      });

      it("should add limit", () => {
        const command = buildSearchCommand({ limit: 10 });
        expect(command).toContain("-n");
        expect(command).toContain("10");
      });

      it("should add starred filter", () => {
        const command = buildSearchCommand({ starred: true });
        expect(command).toContain("-starred");
      });
    });

    describe("buildTagCommand", () => {
      it("should build basic tag command", () => {
        const command = buildTagCommand();
        expect(command).toEqual(["--tags"]);
      });

      it("should add journal parameter", () => {
        const command = buildTagCommand("work");
        expect(command).toEqual(["work", "--tags"]);
      });
    });

    describe("buildListJournalsCommand", () => {
      it("should build list journals command", () => {
        const command = buildListJournalsCommand();
        expect(command).toEqual(["--list"]);
      });
    });
  });
});
