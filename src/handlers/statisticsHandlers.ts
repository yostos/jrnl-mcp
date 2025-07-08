import { JrnlExecutor } from "../utils/jrnlExecutor";
import { buildStatsCommand } from "../utils/commandBuilder";
import { parseTimeGrouping } from "../utils/dateUtils";

export interface TimeGroupStats {
  period: string;
  entryCount: number;
  wordCount: number;
}

export interface JournalStatistics {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  timeGrouping?: TimeGroupStats[];
  topTags?: Array<{ tag: string; count: number }>;
}

export async function getStatistics(
  journal: string | undefined,
  timeGrouping: string | undefined,
  includeTopTags: boolean,
  executor: JrnlExecutor,
): Promise<{ statistics: JournalStatistics }> {
  const command = buildStatsCommand(journal);
  const result = await executor.execute(command);

  try {
    const data = JSON.parse(result);
    const entries = data.entries || [];

    // Calculate basic statistics
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum: number, entry: any) => {
      const bodyWords = entry.body ? entry.body.split(/\s+/).length : 0;
      const titleWords = entry.title ? entry.title.split(/\s+/).length : 0;
      return sum + bodyWords + titleWords;
    }, 0);

    const averageWordsPerEntry =
      totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    const statistics: JournalStatistics = {
      totalEntries,
      totalWords,
      averageWordsPerEntry,
    };

    // Time grouping statistics
    if (timeGrouping) {
      const grouping = parseTimeGrouping(timeGrouping);
      const grouped = groupEntriesByTime(entries, grouping);

      statistics.timeGrouping = Object.entries(grouped).map(
        ([period, entries]) => {
          const wordCount = entries.reduce((sum: number, entry: any) => {
            const bodyWords = entry.body ? entry.body.split(/\s+/).length : 0;
            const titleWords = entry.title
              ? entry.title.split(/\s+/).length
              : 0;
            return sum + bodyWords + titleWords;
          }, 0);

          return {
            period,
            entryCount: entries.length,
            wordCount,
          };
        },
      );
    }

    // Top tags
    if (includeTopTags) {
      const tagCounts = new Map<string, number>();

      entries.forEach((entry: any) => {
        if (entry.tags) {
          entry.tags.forEach((tag: string) => {
            const normalizedTag = tag.startsWith("@") ? tag : `@${tag}`;
            tagCounts.set(
              normalizedTag,
              (tagCounts.get(normalizedTag) || 0) + 1,
            );
          });
        }
      });

      statistics.topTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 tags
    }

    return { statistics };
  } catch (error) {
    throw new Error(`Failed to calculate statistics: ${error}`);
  }
}

function groupEntriesByTime(
  entries: any[],
  grouping: string,
): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  entries.forEach((entry: any) => {
    const date = new Date(entry.date);
    let key: string;

    switch (grouping) {
      case "daily":
        key = date.toISOString().split("T")[0];
        break;
      case "weekly": {
        // Get week number
        const weekNum = getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNum}`;
        break;
      }
      case "monthly":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "yearly":
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  });

  return grouped;
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
