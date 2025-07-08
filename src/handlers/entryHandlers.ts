import { JrnlExecutor } from "../utils/jrnlExecutor";
import { buildSearchCommand, SearchFilters } from "../utils/commandBuilder";

export interface JournalEntry {
  date: string;
  time: string;
  title: string;
  body: string;
  tags: string[];
  starred: boolean;
}

export interface SearchEntriesParams {
  from?: string;
  to?: string;
  tags?: string[];
  contains?: string;
  limit?: number;
  starred?: boolean;
  journal?: string;
}

export async function searchEntries(
  params: SearchEntriesParams,
  executor: JrnlExecutor,
): Promise<{ entries: JournalEntry[]; tags: Record<string, number> }> {
  const filters: SearchFilters = {
    from: params.from,
    to: params.to,
    tags: params.tags,
    contains: params.contains,
    limit: params.limit,
    starred: params.starred,
  };

  const command = buildSearchCommand(filters, params.journal);
  const result = await executor.execute(command);

  try {
    const data = JSON.parse(result);

    // jrnl exports in a specific format, need to transform it
    const entries: JournalEntry[] = data.entries.map((entry: any) => ({
      date: entry.date,
      time: entry.time || "",
      title: entry.title || "",
      body: entry.body || "",
      tags: entry.tags || [],
      starred: entry.starred || false,
    }));

    return {
      entries,
      tags: data.tags || {},
    };
  } catch (error) {
    throw new Error(`Failed to parse jrnl output: ${error}`);
  }
}
