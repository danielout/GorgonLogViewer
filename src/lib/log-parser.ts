import type { LogLine, LogLineType } from "./types";

/**
 * Player.log timestamp pattern: [HH:MM:SS]
 * Chat log timestamp pattern: YY-MM-DD HH:MM:SS
 */
const PLAYER_LOG_TS = /^\[(\d{2}:\d{2}:\d{2})\]\s*/;
const CHAT_LOG_TS = /^(\d{2}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\t/;

/** Chat channel tags like [Global], [Help], [Nearby], etc. */
const CHAT_CHANNEL = /^\[(\w[\w\s]*)\]/;

/** Player.log event prefixes — order matters, first match wins */
const PLAYER_EVENT_PATTERNS: [RegExp, LogLineType][] = [
  // Items & inventory
  [/^LocalPlayer:\s*Process(?:Add|Update|Delete)Item/, "item"],
  [/^LocalPlayer:\s*Process(?:AddTo|RemoveFrom|Show|Refresh)StorageVault/, "item"],
  [/^LocalPlayer:\s*ProcessRecipeComplete/, "item"],
  [/^LocalPlayer:\s*ProcessInventoryFolder/, "item"],
  [/^LocalPlayer:\s*ProcessLockedItems/, "item"],
  [/^LocalPlayer:\s*ProcessExtendedItemUse/, "item"],
  // Skills & abilities
  [/^LocalPlayer:\s*Process(?:Load|Update)Skill/, "skill"],
  [/^LocalPlayer:\s*ProcessLoadAbilities/, "skill"],
  [/^LocalPlayer:\s*ProcessSetActiveSkills/, "skill"],
  [/^LocalPlayer:\s*Process(?:Load|Update|Show)Recipe/, "skill"],
  [/^LocalPlayer:\s*ProcessSetStarredRecipes/, "skill"],
  [/^LocalPlayer:\s*ProcessTrainingScreen/, "skill"],
  [/^LocalPlayer:\s*ProcessDoDelayLoop/, "skill"],
  [/^LocalPlayer:\s*Process(?:Set|Delta)AbilityTimer/, "skill"],
  // Quests
  [/^LocalPlayer:\s*Process(?:Add|Load|Update|Complete|Fail|Select)Quest/, "quest"],
  [/^LocalPlayer:\s*ProcessCompleteDirectedGoals/, "quest"],
  // NPC interaction
  [/^LocalPlayer:\s*Process(?:Start|Wait|End)Interaction/, "interaction"],
  [/^LocalPlayer:\s*Process(?:PreTalk|Talk)Screen/, "interaction"],
  [/^LocalPlayer:\s*ProcessPromptForItem/, "interaction"],
  [/^LocalPlayer:\s*ProcessDeltaFavor/, "interaction"],
  [/^LocalPlayer:\s*ProcessFirstEverInteraction/, "interaction"],
  [/^LocalPlayer:\s*ProcessBarterScreen/, "interaction"],
  [/^LocalPlayer:\s*ProcessInputBox/, "interaction"],
  [/^LocalPlayer:\s*ProcessBook/, "interaction"],
  // Effects & buffs
  [/^LocalPlayer:\s*Process(?:Add|Remove)Effects/, "effect"],
  [/^LocalPlayer:\s*ProcessUpdateEffectName/, "effect"],
  // Attributes
  [/^LocalPlayer:\s*ProcessSetAttributes/, "attribute"],
  // Vendor
  [/^LocalPlayer:\s*ProcessVendor/, "vendor"],
  [/^LocalPlayer:\s*ProcessPlayerVendorScreen/, "vendor"],
  // Combat
  [/^LocalPlayer:\s*ProcessAttack/, "combat"],
  [/^LocalPlayer:\s*ProcessDeathMessage/, "combat"],
  [/^LocalPlayer:\s*ProcessCombatModeStatus/, "combat"],
  [/^LocalPlayer:\s*ProcessRe?spawn/, "combat"],
  // Mount
  [/^LocalPlayer:\s*ProcessPlayerMount/, "mount"],
  [/^LocalPlayer:\s*ProcessMountXpStatus/, "mount"],
  // Weather & celestial
  [/^LocalPlayer:\s*ProcessSetWeather/, "weather"],
  [/^LocalPlayer:\s*ProcessSetCelestialInfo/, "weather"],
];

/** Chat log channel → type mapping */
const CHANNEL_TYPE_MAP: Record<string, LogLineType> = {
  Global: "chat-global",
  Help: "chat-help",
  Nearby: "chat-nearby",
  Guild: "chat-guild",
  Trade: "chat-trade",
  Party: "chat-party",
  Tell: "chat-tell",
  Emotes: "chat-emote",
  Announcement: "chat-announcement",
  Info: "chat-info",
  Error: "chat-error",
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
    return CHANNEL_TYPE_MAP[match[1]] ?? "chat-custom";
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

/** Parse incremental content (new lines appended to a file) starting from a given line number */
export function parseLogLines(content: string, filePath: string, startLineNumber: number): LogLine[] {
  const rawLines = content.split(/\r?\n/);
  const chatMode = isChatLog(filePath);
  const tsPattern = chatMode ? CHAT_LOG_TS : PLAYER_LOG_TS;
  const classify = chatMode ? classifyChatLogLine : classifyPlayerLogLine;

  const lines: LogLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (raw.length === 0 && i === rawLines.length - 1) continue;

    const tsMatch = raw.match(tsPattern);
    const timestamp = tsMatch ? tsMatch[1] : null;
    const contentStart = tsMatch ? tsMatch[0].length : 0;
    const lineContent = raw.slice(contentStart);

    lines.push({
      lineNumber: startLineNumber + i,
      raw,
      timestamp,
      timestampDate: timestamp ? parseTimestampDate(timestamp) : null,
      type: timestamp ? classify(lineContent) : "system",
      content: lineContent,
    });
  }

  return lines;
}
