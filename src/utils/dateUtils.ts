export function formatDateForJrnl(
  date: string | undefined,
): string | undefined {
  if (!date) return undefined;

  // jrnl accepts natural language dates, so we can pass them through
  // Examples: "yesterday", "last monday", "3 days ago", "2024-01-15"
  return date;
}

export function parseTimeGrouping(grouping: string): string {
  const groupingMap: Record<string, string> = {
    day: "daily",
    week: "weekly",
    month: "monthly",
    year: "yearly",
  };

  return groupingMap[grouping] || "daily";
}
