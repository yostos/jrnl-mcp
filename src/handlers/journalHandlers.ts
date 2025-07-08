import { JrnlExecutor } from "../utils/jrnlExecutor";
import { buildListJournalsCommand } from "../utils/commandBuilder";

export interface JournalInfo {
  name: string;
  path: string;
  isDefault: boolean;
}

let currentJournal: string | undefined = undefined;

export async function listJournals(
  executor: JrnlExecutor,
): Promise<{ journals: JournalInfo[]; currentJournal?: string }> {
  const command = buildListJournalsCommand();
  const result = await executor.execute(command);

  try {
    // Parse jrnl --list output
    // Format can be:
    // Journals defined in config (/path/to/config)
    // * default -> /path/to/default.txt
    //   work -> /path/to/work.txt
    const lines = result.trim().split("\n");
    const journals: JournalInfo[] = [];

    for (const line of lines) {
      // Skip header lines
      if (line.includes("Journals defined in config") || line.trim() === "") {
        continue;
      }

      const match = line.match(/^(\s*\*?\s*)(\w+)\s*->\s*(.+)$/);
      if (match) {
        const isDefault = line.trim().startsWith("*");
        const name = match[2].trim();
        const path = match[3].trim();

        journals.push({
          name,
          path,
          isDefault,
        });

        if (isDefault && !currentJournal) {
          currentJournal = name;
        }
      }
    }

    return {
      journals,
      currentJournal,
    };
  } catch (error) {
    throw new Error(`Failed to parse journal list: ${error}`);
  }
}

export async function setJournal(
  journalName: string,
): Promise<{ success: boolean; currentJournal: string }> {
  currentJournal = journalName;

  return {
    success: true,
    currentJournal: journalName,
  };
}

export function getCurrentJournal(): string | undefined {
  return currentJournal;
}
