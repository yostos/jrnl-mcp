import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { spawn, ChildProcess } from "child_process";
import { JrnlExecutor } from "../src/utils/jrnlExecutor";

describe("jrnl MCP Server Integration Tests", () => {
  let serverProcess: ChildProcess;
  let executor: JrnlExecutor;

  beforeAll(() => {
    executor = new JrnlExecutor();
  });

  describe("JrnlExecutor", () => {
    it("should execute jrnl commands", async () => {
      const result = await executor.execute(["--version"]);
      expect(result).toContain("jrnl");
    });
  });

  describe("MCP Server", () => {
    beforeAll((done) => {
      serverProcess = spawn("node", ["dist/index.js"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      serverProcess.stderr?.once("data", (data) => {
        if (data.toString().includes("jrnl MCP server started")) {
          done();
        }
      });
    });

    afterAll(() => {
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    it("should list available tools", (done) => {
      const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      };

      serverProcess.stdin?.write(JSON.stringify(request) + "\n");

      serverProcess.stdout?.once("data", (data) => {
        const response = JSON.parse(data.toString().trim());
        expect(response.result.tools).toBeDefined();
        expect(response.result.tools.length).toBe(6);

        const toolNames = response.result.tools.map((t: any) => t.name);
        expect(toolNames).toContain("search_entries");
        expect(toolNames).toContain("list_tags");
        expect(toolNames).toContain("analyze_tag_cooccurrence");
        expect(toolNames).toContain("get_statistics");
        expect(toolNames).toContain("list_journals");
        expect(toolNames).toContain("set_journal");

        done();
      });
    });

    it("should handle call tool request for list_journals", (done) => {
      const request = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "list_journals",
          arguments: {},
        },
      };

      serverProcess.stdin?.write(JSON.stringify(request) + "\n");

      serverProcess.stdout?.once("data", (data) => {
        const response = JSON.parse(data.toString().trim());
        expect(response.result.content).toBeDefined();
        expect(response.result.content[0].type).toBe("text");

        const result = JSON.parse(response.result.content[0].text);
        expect(result.journals).toBeDefined();
        expect(Array.isArray(result.journals)).toBe(true);

        done();
      });
    });

    describe("search_entries tool", () => {
      it("should search entries without filters", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {},
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.tags).toBeDefined();

          done();
        });
      });

      it("should search entries with date filters", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {
              from_date: "last week",
              to_date: "today",
            },
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.tags).toBeDefined();

          done();
        });
      });

      it("should search entries with tag filters", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {
              tags: ["@ciac"],
            },
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.tags).toBeDefined();
          // Check that filtered entries only contain the requested tag
          if (result.entries.length > 0) {
            expect(
              result.entries.every(
                (entry: any) => entry.tags && entry.tags.includes("@ciac"),
              ),
            ).toBe(true);
          }

          done();
        });
      });

      it("should search entries with multiple tag filters", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {
              tags: ["@ciac"],
              tag_mode: "and",
            },
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.tags).toBeDefined();
          // Check that filtered entries only contain the requested tag
          if (result.entries.length > 0) {
            expect(
              result.entries.every(
                (entry: any) => entry.tags && entry.tags.includes("@ciac"),
              ),
            ).toBe(true);
          }

          done();
        });
      });

      it("should search entries with text filter", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {
              text: "meeting",
            },
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.tags).toBeDefined();

          done();
        });
      });

      it("should search entries with combined filters", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 8,
          method: "tools/call",
          params: {
            name: "search_entries",
            arguments: {
              from_date: "last month",
              tags: ["@ciac"],
              text: "meeting",
              limit: 5,
            },
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.entries).toBeDefined();
          expect(Array.isArray(result.entries)).toBe(true);
          expect(result.entries.length).toBeLessThanOrEqual(5);
          expect(result.tags).toBeDefined();

          done();
        });
      });
    });

    describe("list_tags tool", () => {
      it("should list all tags", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: {
            name: "list_tags",
            arguments: {},
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.tags).toBeDefined();
          expect(typeof result.tags).toBe("object");
          expect(result.tags["@ciac"]).toBeGreaterThan(0);

          done();
        });
      });
    });

    describe("get_statistics tool", () => {
      it("should get journal statistics", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 10,
          method: "tools/call",
          params: {
            name: "get_statistics",
            arguments: {},
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.statistics).toBeDefined();
          expect(result.statistics.totalEntries).toBeGreaterThanOrEqual(0);
          expect(result.statistics.totalWords).toBeGreaterThanOrEqual(0);
          expect(result.statistics.averageWordsPerEntry).toBeGreaterThanOrEqual(
            0,
          );

          done();
        });
      });
    });

    describe("analyze_tag_cooccurrence tool", () => {
      it("should analyze tag co-occurrence", (done) => {
        const request = {
          jsonrpc: "2.0",
          id: 11,
          method: "tools/call",
          params: {
            name: "analyze_tag_cooccurrence",
            arguments: {},
          },
        };

        serverProcess.stdin?.write(JSON.stringify(request) + "\n");

        serverProcess.stdout?.once("data", (data) => {
          const response = JSON.parse(data.toString().trim());
          expect(response.result.content).toBeDefined();
          expect(response.result.content[0].type).toBe("text");

          const result = JSON.parse(response.result.content[0].text);
          expect(result.cooccurrences).toBeDefined();
          expect(Array.isArray(result.cooccurrences)).toBe(true);

          done();
        });
      });
    });
  });
});
