/**
 * Type definitions for jrnl data structures
 */

/**
 * A single journal entry from jrnl
 */
export interface JrnlEntry {
  date: string;
  time?: string;
  title?: string;
  body?: string;
  tags?: string[];
  starred?: boolean;
}

/**
 * Raw jrnl JSON export output
 */
export interface JrnlExportOutput {
  tags: Record<string, number>;
  entries: JrnlEntry[];
}

/**
 * Journal information from jrnl --list
 */
export interface JrnlJournalInfo {
  name: string;
  path: string;
  isDefault: boolean;
}

/**
 * Statistics for a time period
 */
export interface TimeGroupStats {
  period: string;
  entryCount: number;
  wordCount: number;
}

/**
 * Tag with count
 */
export interface TagCount {
  tag: string;
  count: number;
}
