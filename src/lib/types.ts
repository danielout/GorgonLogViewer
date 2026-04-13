/** Recognized log line categories */
export type LogLineType =
  | "chat-global"
  | "chat-help"
  | "chat-nearby"
  | "chat-guild"
  | "chat-trade"
  | "chat-party"
  | "combat"
  | "status"
  | "npc"
  | "action"
  | "system"
  | "item"
  | "skill"
  | "unknown";

/** A single parsed log line */
export interface LogLine {
  /** Original line number in the file (1-based) */
  lineNumber: number;
  /** Raw text of the line */
  raw: string;
  /** Parsed timestamp string, if present (e.g. "06:27:20" or "26-02-10 06:27:20") */
  timestamp: string | null;
  /** Timestamp parsed as a Date for filtering, if available */
  timestampDate: Date | null;
  /** Categorized line type for filtering/highlighting */
  type: LogLineType;
  /** The content after the timestamp/prefix */
  content: string;
}

/** The kind of file that was opened */
export type FileKind = "log" | "json" | "text";

/** An opened file in the viewer */
export interface OpenFile {
  path: string;
  name: string;
  kind: FileKind;
  lines: LogLine[];
  rawContent: string;
  tailing: boolean;
}

/** Filter state for the log viewer */
export interface FilterState {
  /** Text or regex search query */
  search: string;
  /** Whether to treat search as regex */
  isRegex: boolean;
  /** Which line types to show (empty = show all) */
  enabledTypes: Set<LogLineType>;
  /** Timestamp range filter */
  timeFrom: Date | null;
  timeTo: Date | null;
  /** Entity ID filter — shows only lines containing this ID */
  entityId: string;
}
