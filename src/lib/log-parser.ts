import type { LogLine, LogLineType } from "./types";

/**
 * Player.log timestamp pattern: [HH:MM:SS]
 * Chat log timestamp pattern: YY-MM-DD HH:MM:SS
 */
const PLAYER_LOG_TS = /^\[(\d{2}:\d{2}:\d{2})\]\s*/;
const CHAT_LOG_TS = /^(\d{2}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\t/;

/** Chat channel tags like [Global], [Help], [Nearby], etc. */
const CHAT_CHANNEL = /^\[(\w[\w\s]*)\]/;

/** Player.log event prefixes */
const PLAYER_EVENT_PATTERNS: [RegExp, LogLineType][] = [
  [/^LocalPlayer:\s*Process(?:Add|Update|Delete)Item/, "item"],
  [/^LocalPlayer:\s*ProcessAddToStorageVault/, "item"],
  [/^LocalPlayer:\s*ProcessLoadSkills/, "skill"],
  [/^LocalPlayer:\s*ProcessUpdateSkill/, "skill"],
  [/^LocalPlayer:\s*ProcessRecipeComplete/, "item"],
];

/** Chat log channel → type mapping */
const CHANNEL_TYPE_MAP: Record<string, LogLineType> = {
  Global: "chat-global",
  Help: "chat-help",
  Nearby: "chat-nearby",
  Guild: "chat-guild",
  Trade: "chat-trade",
  Party: "chat-party",
  Combat: "combat",
  Status: "status",
  "NPC Chatter": "npc",
  "Action Emotes": "action",
};

function classifyPlayerLogLine(content: string): LogLineType {
  for (const [pattern, type] of PLAYER_EVENT_PATTERNS) {
    if (pattern.test(content)) return type;
  }
  return "system";
}

function classifyChatLogLine(content: string): LogLineType {
  const match = content.match(CHAT_CHANNEL);
  if (match) {
    return CHANNEL_TYPE_MAP[match[1]] ?? "unknown";
  }
  return "unknown";
}

function parseTimestampDate(ts: string): Date | null {
  // Chat log format: YY-MM-DD HH:MM:SS
  const chatMatch = ts.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (chatMatch) {
    const [, yy, mm, dd, hh, min, ss] = chatMatch;
    return new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min), parseInt(ss));
  }

  // Player.log format: HH:MM:SS (no date, use today)
  const playerMatch = ts.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (playerMatch) {
    const [, hh, min, ss] = playerMatch;
    const d = new Date();
    d.setHours(parseInt(hh), parseInt(min), parseInt(ss), 0);
    return d;
  }

  return null;
}

function isChatLog(filePath: string): boolean {
  const name = filePath.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  return name.startsWith("chat");
}

export function parseLogFile(content: string, filePath: string): LogLine[] {
  const rawLines = content.split(/\r?\n/);
  const chatMode = isChatLog(filePath);
  const tsPattern = chatMode ? CHAT_LOG_TS : PLAYER_LOG_TS;
  const classify = chatMode ? classifyChatLogLine : classifyPlayerLogLine;

  const lines: LogLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (raw.length === 0 && i === rawLines.length - 1) continue; // skip trailing blank

    const tsMatch = raw.match(tsPattern);
    const timestamp = tsMatch ? tsMatch[1] : null;
    const contentStart = tsMatch ? tsMatch[0].length : 0;
    const content = raw.slice(contentStart);

    lines.push({
      lineNumber: i + 1,
      raw,
      timestamp,
      timestampDate: timestamp ? parseTimestampDate(timestamp) : null,
      type: timestamp ? classify(content) : "system",
      content,
    });
  }

  return lines;
}
