import type { LogLineType } from "./types";
import { generatedEventInfoMap } from "./generated/reference-entries";

export interface EventFieldInfo {
  name: string;
  type: string;
}

export interface EventInfo {
  name: string;
  summary: string;
  fields?: EventFieldInfo[];
}

/** Chat log channel → reference info */
const CHAT_CHANNEL_INFO: Record<string, EventInfo> = {
  Global: { name: "Global Chat", summary: "Server-wide chat channel visible to all players." },
  Help: { name: "Help Chat", summary: "Help channel for player questions and answers." },
  Nearby: { name: "Nearby Chat", summary: "Local area chat, visible to players in proximity." },
  Guild: { name: "Guild Chat", summary: "Private guild member channel." },
  Trade: { name: "Trade Chat", summary: "Channel for buy/sell/trade offers." },
  Party: { name: "Party Chat", summary: "Private party/group member channel." },
  Tell: { name: "Tell", summary: "Private direct message between two players." },
  Combat: { name: "Combat", summary: "Combat events: damage dealt/received, healing, deaths." },
  Status: { name: "Status", summary: "System status messages (e.g., tracking compass updates, item locations)." },
  "NPC Chatter": { name: "NPC Chatter", summary: "Ambient NPC dialogue and reactions." },
  "Action Emotes": { name: "Action Emotes", summary: "Player emote actions (e.g., /bow, /wave, burying corpses)." },
  Announcement: { name: "Announcement", summary: "Server-wide announcements." },
  Info: { name: "Info", summary: "Informational system messages." },
  Error: { name: "Error", summary: "Error messages from the game client." },
};

const CHAT_CHANNEL_RE = /^\[(\w[\w\s]*)\]/;

/** Look up reference info for a log line based on its content and type */
export function getEventInfo(content: string, type: LogLineType): EventInfo | null {
  // Chat log lines
  if (type.startsWith("chat-") || type === "combat" || type === "status" || type === "npc" || type === "action") {
    const match = content.match(CHAT_CHANNEL_RE);
    if (match && CHAT_CHANNEL_INFO[match[1]]) {
      return CHAT_CHANNEL_INFO[match[1]];
    }
  }

  // Player.log events — from generated docs data
  for (const [pattern, info] of generatedEventInfoMap) {
    if (pattern.test(content)) return info;
  }

  return null;
}
