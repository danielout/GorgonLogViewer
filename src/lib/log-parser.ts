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
  [/^LocalPlayer:\s*ProcessAddAbility/, "skill"],
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
  // Mount & pets
  [/^LocalPlayer:\s*ProcessPlayerMount/, "mount"],
  [/^LocalPlayer:\s*ProcessMountXpStatus/, "mount"],
  [/^LocalPlayer:\s*ProcessSetPet/, "mount"],
  // P2P interaction
  [/^LocalPlayer:\s*ProcessP2P/, "interaction"],
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

/** Non-Process line patterns: [regex, type, eventName] */
const NON_PROCESS_PATTERNS: [RegExp, LogLineType, string][] = [
  // Appearance/rendering
  [/^Appearance /, "appearance", "Appearance"],
  [/^An appearance preview/, "appearance", "AppearancePreview"],
  [/^Download appearance loop/, "appearance", "DownloadAppearance"],
  [/^Successfully downloaded Texture/, "appearance", "TextureDownload"],
  [/^LoadAssetAsync:/, "asset", "LoadAssetAsync"],
  [/^IsDoneLoading:/, "asset", "IsDoneLoading"],
  [/^Completed /, "asset", "AssetCompleted"],
  [/^Download processing for /, "asset", "DownloadProcessing"],
  [/^Ref-count cleanup of appearance/, "asset", "RefCountCleanup"],
  // Network
  [/^New Network State:/, "network", "NetworkState"],
  [/^!!! Initializing area!/, "network", "InitializingArea"],
  [/^Sent C_INIT2/, "network", "SentInit"],
  [/^Connect succeeded/, "network", "ConnectSucceeded"],
  [/^Lost connection to server/, "network", "LostConnection"],
  [/^Logged in as character/, "network", "LoggedIn"],
  [/^Vivox /, "network", "Vivox"],
  [/^Participant /, "network", "VoiceParticipant"],
  [/^Joined voice channel/, "network", "VoiceJoined"],
  [/^Left voice channel/, "network", "VoiceLeft"],
  // Audio
  [/^\d+[\d.]*: Playing sound/, "audio", "PlayingSound"],
  // Errors/warnings
  [/^ Error:/, "error", "Error"],
  [/^ Warning:/, "error", "Warning"],
  // Combat (non-Process)
  [/^entity_.*OnAttackHitMe/, "combat", "OnAttackHitMe"],
  [/^localPlayer.*OnAttackHitMe/, "combat", "OnAttackHitMe"],
  [/^UseAbility/, "combat", "UseAbility"],
  [/^Move to .* finished, trying again/, "combat", "MoveToAbility"],
  // Emotes (non-Process, no LocalPlayer prefix)
  [/^ProcessEmote/, "action", "ProcessEmote"],
  [/^ProcessUpdateDescription/, "system", "ProcessUpdateDescription"],
  [/^ProcessCommand /, "system", "ProcessCommand"],
];

/** Extract event name from a Process* line */
const PROCESS_EVENT_RE = /(?:LocalPlayer:\s*)(Process\w+)/;

interface ClassifyResult {
  type: LogLineType;
  eventName: string | null;
}

function classifyPlayerLogLine(content: string): ClassifyResult {
  // Check Process* events first (LocalPlayer: prefix)
  for (const [pattern, type] of PLAYER_EVENT_PATTERNS) {
    if (pattern.test(content)) {
      const m = content.match(PROCESS_EVENT_RE);
      return { type, eventName: m?.[1] ?? null };
    }
  }

  // Check non-Process patterns
  for (const [pattern, type, eventName] of NON_PROCESS_PATTERNS) {
    if (pattern.test(content)) {
      return { type, eventName };
    }
  }

  return { type: "system", eventName: null };
}

/** Classify non-timestamped lines (startup, stack traces, etc.) */
function classifyNonTimestamped(raw: string): ClassifyResult {
  // Stack traces
  if (raw.startsWith("  at ") || raw.startsWith("0x")) return { type: "error", eventName: "StackTrace" };
  // Engine init
  if (raw.startsWith("[Physics::Module]") || raw.startsWith("[D3D12 ") || raw.startsWith("Direct3D:")) return { type: "asset", eventName: "EngineInit" };
  if (raw.startsWith("Initialize engine") || raw.startsWith("Input System") || raw.startsWith("GfxDevice:")) return { type: "asset", eventName: "EngineInit" };
  if (raw.startsWith("<RI>") || raw.startsWith("UnloadTime:") || raw.startsWith("Unloading ")) return { type: "asset", eventName: "AssetUnload" };
  if (raw.startsWith("Setting quality") || raw.startsWith("Loading preferences") || raw.startsWith("Applying special")) return { type: "asset", eventName: "Settings" };
  if (raw.startsWith("Shader ")) return { type: "asset", eventName: "ShaderWarning" };
  // Network/auth
  if (raw.startsWith("Steam ") || raw.startsWith("**** Logged into Steam") || raw.startsWith("Game owned")) return { type: "network", eventName: "SteamAuth" };
  if (raw.startsWith("Servers:") || raw.startsWith("Entry #") || raw.startsWith("Parsed http") || raw.startsWith("Downloading ")) return { type: "network", eventName: "ConfigDownload" };
  if (raw.startsWith("Loading news") || raw.startsWith("Curl error")) return { type: "network", eventName: "ConfigDownload" };
  if (raw.startsWith("LOADING LEVEL")) return { type: "network", eventName: "LoadingLevel" };
  // Appearance
  if (raw.startsWith("@Base") || raw.startsWith("Animator")) return { type: "appearance", eventName: "Appearance" };
  // Errors
  if (raw.includes("Error") || raw.includes("error")) return { type: "error", eventName: "Error" };
  // Audio
  if (raw.startsWith("<color=pink>")) return { type: "audio", eventName: "MusicControl" };
  if (raw.startsWith("Bow was active")) return { type: "combat", eventName: "WeaponState" };
  return { type: "system", eventName: null };
}

function classifyChatLogLine(content: string): ClassifyResult {
  const match = content.match(CHAT_CHANNEL);
  if (match) {
    const channel = match[1];
    return { type: CHANNEL_TYPE_MAP[channel] ?? "chat-custom", eventName: channel };
  }
  return { type: "unknown", eventName: null };
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

    const classified = timestamp ? classify(content) : classifyNonTimestamped(raw);
    lines.push({
      lineNumber: i + 1,
      raw,
      timestamp,
      timestampDate: timestamp ? parseTimestampDate(timestamp) : null,
      type: classified.type,
      content,
      eventName: classified.eventName,
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

    const classified = timestamp ? classify(lineContent) : classifyNonTimestamped(raw);
    lines.push({
      lineNumber: startLineNumber + i,
      raw,
      timestamp,
      timestampDate: timestamp ? parseTimestampDate(timestamp) : null,
      type: classified.type,
      content: lineContent,
      eventName: classified.eventName,
    });
  }

  return lines;
}
