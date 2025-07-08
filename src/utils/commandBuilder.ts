import { formatDateForJrnl } from "./dateUtils";

export interface SearchFilters {
  from?: string;
  to?: string;
  tags?: string[];
  contains?: string;
  limit?: number;
  starred?: boolean;
}

export function buildSearchCommand(
  filters: SearchFilters,
  journal?: string,
): string[] {
  const args: string[] = [];

  if (journal) {
    args.push(journal);
  }

  if (filters.from) {
    args.push(`-from`, formatDateForJrnl(filters.from) || filters.from);
  }

  if (filters.to) {
    args.push(`-to`, formatDateForJrnl(filters.to) || filters.to);
  }

  if (filters.tags && filters.tags.length > 0) {
    // For AND logic: @tag1 @tag2
    // For OR logic: @tag1 or @tag2
    // Currently implementing AND logic
    filters.tags.forEach((tag) => {
      args.push(tag.startsWith("@") ? tag : `@${tag}`);
    });
  }

  if (filters.contains) {
    args.push(`-contains`, filters.contains);
  }

  if (filters.limit) {
    args.push(`-n`, filters.limit.toString());
  }

  if (filters.starred) {
    args.push(`-starred`);
  }

  args.push("--export", "json");

  return args;
}

export function buildTagCommand(journal?: string): string[] {
  const args: string[] = [];

  if (journal) {
    args.push(journal);
  }

  args.push("--tags");

  return args;
}

export function buildStatsCommand(
  journal?: string,
  _timeGrouping?: string,
): string[] {
  const args: string[] = [];

  if (journal) {
    args.push(journal);
  }

  // For statistics, we'll export all entries and calculate stats
  args.push("--export", "json");

  return args;
}

export function buildListJournalsCommand(): string[] {
  return ["--list"];
}
