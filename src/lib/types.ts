/** Recognized log line categories */
export type LogLineType =
  // Chat channels
  | "chat-global"
  | "chat-help"
  | "chat-nearby"
  | "chat-guild"
  | "chat-trade"
  | "chat-party"
  | "chat-tell"
  | "chat-emote"
  | "chat-announcement"
  | "chat-info"
  | "chat-error"
  | "chat-custom"
  // Shared
  | "combat"
  | "status"
  | "npc"
  | "action"
  // Player.log categories
  | "item"
  | "skill"
  | "quest"
  | "interaction"
  | "effect"
  | "attribute"
  | "vendor"
  | "mount"
  | "weather"
  // Engine & system sub-categories
  | "appearance"
  | "network"
  | "audio"
  | "error"
  | "asset"
  | "system"
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

/** A custom highlight rule: matches lines by pattern and applies a color */
export interface HighlightRule {
  /** Display name for the rule */
  name: string;
  /** Text or regex pattern to match against the line */
  pattern: string;
  /** Whether pattern is a regex */
  isRegex: boolean;
  /** CSS color to apply (hex) */
  color: string;
  /** Whether this rule is active */
  enabled: boolean;
}

/** A shareable filter configuration */
export interface FilterConfig {
  /** Display name */
  name: string;
  /** Unique ID */
  id: string;
  /** Which line types to show (null = show all) */
  enabledTypes: LogLineType[] | null;
  /** Custom highlight rules */
  highlights: HighlightRule[];
}

/** A saved view preset — captures the full filter + config state */
export interface ViewPreset {
  /** Display name */
  name: string;
  /** Unique ID */
  id: string;
  /** Saved filter state (types stored as array for serialization) */
  search: string;
  isRegex: boolean;
  enabledTypes: LogLineType[];
  timeFrom: string;
  timeTo: string;
  entityId: string;
  /** ID of the active filter config, if any */
  filterConfigId: string | null;
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
