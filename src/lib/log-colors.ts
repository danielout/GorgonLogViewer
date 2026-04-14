import type { LogLineType } from "./types";

const TYPE_COLOR_MAP: Record<LogLineType, string> = {
  "chat-global": "text-log-chat-global",
  "chat-help": "text-log-chat-help",
  "chat-nearby": "text-log-chat-nearby",
  "chat-guild": "text-log-chat-guild",
  "chat-trade": "text-log-chat-trade",
  "chat-party": "text-log-chat-trade",
  "chat-tell": "text-log-chat-tell",
  "chat-emote": "text-log-chat-emote",
  "chat-announcement": "text-log-chat-announcement",
  "chat-info": "text-log-chat-info",
  "chat-error": "text-log-chat-error",
  "chat-custom": "text-log-chat-custom",
  combat: "text-log-combat",
  status: "text-log-status",
  npc: "text-log-npc",
  action: "text-log-action",
  item: "text-log-item",
  skill: "text-log-skill",
  quest: "text-log-quest",
  interaction: "text-log-interaction",
  p2p: "text-log-interaction",
  effect: "text-log-effect",
  attribute: "text-log-attribute",
  vendor: "text-log-vendor",
  mount: "text-log-mount",
  weather: "text-log-weather",
  appearance: "text-log-appearance",
  network: "text-log-network",
  audio: "text-log-audio",
  error: "text-log-error",
  asset: "text-log-asset",
  system: "text-log-system",
  unknown: "text-text-secondary",
};

export function typeColorClass(type: LogLineType): string {
  return TYPE_COLOR_MAP[type] ?? "text-text-secondary";
}

export function typeLabel(type: LogLineType): string {
  return type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
