/** A field in an event or schema */
export interface RefField {
  name: string;
  type: string;
  description: string;
}

/** A reference entry for a log event, chat channel, or data format */
export interface RefEntry {
  /** Display name */
  name: string;
  /** Category grouping */
  category: string;
  /** Format pattern (e.g., "[HH:MM:SS] LocalPlayer: ProcessAddItem(...)") */
  format?: string;
  /** Description of what this event/type does */
  description: string;
  /** When this fires or is relevant */
  whenItFires?: string[];
  /** Important notes */
  notes?: string[];
  /** Field definitions */
  fields?: RefField[];
  /** Tags for search */
  tags: string[];
}

// ─── Generated from docs ────────────────────────────────────────

import { generatedPlayerLogEvents } from "./generated/reference-entries";

// ─── Chat Channels ──────────────────────────────────────────────

const chatChannels: RefEntry[] = [
  {
    name: "Global",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Global] PlayerName: message",
    description: "Server-wide chat channel visible to all players.",
    tags: ["chat", "global", "server"],
  },
  {
    name: "Help",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Help] PlayerName: message",
    description: "Help channel for player questions and answers.",
    tags: ["chat", "help", "question"],
  },
  {
    name: "Nearby",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Nearby] PlayerName: message",
    description: "Local area chat, visible to players in proximity.",
    tags: ["chat", "nearby", "local"],
  },
  {
    name: "Guild",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Guild] PlayerName: message",
    description: "Private guild member channel.",
    tags: ["chat", "guild", "private"],
  },
  {
    name: "Trade",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Trade] PlayerName: message",
    description: "Channel for buy/sell/trade offers.",
    tags: ["chat", "trade", "buy", "sell"],
  },
  {
    name: "Party",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Party] PlayerName: message",
    description: "Private party/group member channel.",
    tags: ["chat", "party", "group"],
  },
  {
    name: "Tell",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Tell] PlayerName: message",
    description: "Private direct message between two players.",
    tags: ["chat", "tell", "whisper", "pm", "private"],
  },
  {
    name: "Combat",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Combat] entity: message",
    description: "Combat events: damage dealt/received, healing, deaths.",
    tags: ["chat", "combat", "damage", "heal"],
  },
  {
    name: "Status",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Status] message",
    description: "System status messages (tracking compass, item locations, survey results).",
    tags: ["chat", "status", "system", "compass"],
  },
  {
    name: "NPC Chatter",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[NPC Chatter] NpcName: message",
    description: "Ambient NPC dialogue and reactions.",
    tags: ["chat", "npc", "ambient"],
  },
  {
    name: "Action Emotes",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Action Emotes] message",
    description: "Player emote actions (e.g., /bow, /wave, burying corpses).",
    tags: ["chat", "emote", "action"],
  },
  {
    name: "Announcement",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Announcement] message",
    description: "Server-wide announcements from the game system or admins.",
    tags: ["chat", "announcement", "server"],
  },
  {
    name: "Info",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Info] message",
    description: "Informational system messages.",
    tags: ["chat", "info", "system"],
  },
  {
    name: "Error",
    category: "Chat Channels",
    format: "YY-MM-DD HH:MM:SS\\t[Error] message",
    description: "Error messages from the game client.",
    tags: ["chat", "error"],
  },
];

// ─── Log Format Reference ───────────────────────────────────────

const logFormats: RefEntry[] = [
  {
    name: "Player.log Format",
    category: "Log Formats",
    description: "The main game client log file. Each timestamped line starts with [HH:MM:SS] followed by the event source and data.",
    format: "[HH:MM:SS] Source: EventName(args...)",
    notes: [
      "Located at AppData/LocalLow/Elder Game/Project Gorgon/Player.log",
      "Timestamps are local time, no date — file is per-session",
      "Lines without timestamps are continuations or system init messages",
      "Most gameplay events start with 'LocalPlayer:'",
    ],
    tags: ["format", "player.log", "timestamp"],
  },
  {
    name: "Chat Log Format",
    category: "Log Formats",
    description: "Chat logs capture all chat channel messages with full timestamps including date.",
    format: "YY-MM-DD HH:MM:SS\\t[Channel] Sender: message",
    notes: [
      "Located at AppData/LocalLow/Elder Game/Project Gorgon/ChatLogs/",
      "Filenames are Chat-YY-MM-DD.log (one per day)",
      "Tab-separated between timestamp and message content",
      "First line is login marker with character name and timezone",
      "Custom channels appear in lowercase brackets (e.g., [mychannel])",
    ],
    tags: ["format", "chat", "timestamp", "channel"],
  },
  {
    name: "Character JSON",
    category: "Log Formats",
    description: "JSON export of character data including skills, recipes, NPC favor levels, and settings.",
    notes: [
      "Contains CurrentStats, Skills (with levels and XP), RecipeCompletions, NpcFavorLevels",
      "Useful for tracking character progression over time",
    ],
    tags: ["format", "json", "character", "export"],
  },
  {
    name: "Inventory JSON",
    category: "Log Formats",
    description: "JSON export of player inventory with item details, stack sizes, and metadata.",
    notes: [
      "Each item has InternalName, StackSize, ItemTypeId, and other properties",
      "Filename includes character name and timestamp",
    ],
    tags: ["format", "json", "inventory", "items"],
  },
];

// ─── CDN JSON Reference ─────────────────────────────────────────

const cdnReference: RefEntry[] = [
  { name: "abilities.json", category: "CDN Data", description: "All ability definitions including damage, power cost, cooldown, and skill requirements.", tags: ["cdn", "abilities", "skills", "combat"] },
  { name: "items.json", category: "CDN Data", description: "All item definitions including names, descriptions, stats, and item type IDs.", notes: ["Item type IDs from ProcessUpdateItemCode map to entries here"], tags: ["cdn", "items", "equipment", "inventory"] },
  { name: "skills.json", category: "CDN Data", description: "Skill definitions including level caps, advancement hints, rewards, and recipe ingredient keywords.", tags: ["cdn", "skills", "levels", "progression"] },
  { name: "recipes.json", category: "CDN Data", description: "Crafting recipe definitions with ingredients, results, and skill requirements.", tags: ["cdn", "recipes", "crafting"] },
  { name: "npcs.json", category: "CDN Data", description: "NPC definitions including names, locations, and services offered.", tags: ["cdn", "npcs", "vendors"] },
  { name: "effects.json", category: "CDN Data", description: "Effect/buff definitions. Effect IDs from ProcessAddEffects map to entries here.", tags: ["cdn", "effects", "buffs", "debuffs"] },
  { name: "quests.json", category: "CDN Data", description: "Quest definitions with objectives, rewards, and requirements.", tags: ["cdn", "quests"] },
  { name: "areas.json", category: "CDN Data", description: "Game area/zone definitions with friendly names.", tags: ["cdn", "areas", "zones", "maps"] },
  { name: "attributes.json", category: "CDN Data", description: "Attribute definitions for the values seen in ProcessSetAttributes.", tags: ["cdn", "attributes", "stats"] },
  { name: "storagevaults.json", category: "CDN Data", description: "Storage vault definitions per NPC, with slot counts and requirements.", tags: ["cdn", "storage", "vaults"] },
];

// ─── Practical Patterns ─────────────────────────────────────────

const patterns: RefEntry[] = [
  {
    name: "Selling to Vendors",
    category: "Event Patterns",
    description: "When selling an item to an NPC vendor, look for ProcessDeleteItem followed by ProcessVendorAddItem with the same item.",
    notes: ["ProcessDeleteItem(instanceId) — item leaves inventory", "ProcessVendorAddItem — item appears in vendor's stock", "Gold change shown via ProcessSetAttributes"],
    tags: ["pattern", "sell", "vendor", "gold"],
  },
  {
    name: "Gift Giving",
    category: "Event Patterns",
    description: "Giving gifts to NPCs follows a specific event sequence for tracking favor gains.",
    notes: ["ProcessPromptForItem — gift UI opens", "ProcessDeleteItem — gift item consumed", "ProcessDeltaFavor — favor gained (delta varies per item)", "ProcessUpdateQuest — if favor crosses a threshold"],
    tags: ["pattern", "gift", "favor", "npc"],
  },
  {
    name: "Storage Transfer",
    category: "Event Patterns",
    description: "Moving items to/from storage vaults. Distinguish from real deletion by checking for vault events.",
    notes: ["Stowing: ProcessDeleteItem → ProcessAddToStorageVault (same instanceId)", "Retrieving: ProcessRemoveFromStorageVault → ProcessAddItem", "Bulk stow can produce many pairs in sequence"],
    tags: ["pattern", "storage", "vault", "stow", "retrieve"],
  },
  {
    name: "Crafting Consumption",
    category: "Event Patterns",
    description: "When crafting consumes ingredients, look for stack decrements or deletions followed by recipe completion.",
    notes: ["ProcessUpdateItemCode — ingredient stack decremented (delta < 0)", "ProcessDeleteItem — ingredient fully consumed", "ProcessRecipeComplete — recipe finishes", "ProcessAddItem — crafting result enters inventory"],
    tags: ["pattern", "craft", "recipe", "consume"],
  },
  {
    name: "Motherlode Survey",
    category: "Event Patterns",
    description: "Using a survey/motherlode map to find a resource node.",
    notes: ["ProcessMapFx — compass/map marker appears", "Player navigates to location", "ProcessDeleteItem — map consumed on success", "ProcessAddItem — surveyed resource enters inventory"],
    tags: ["pattern", "survey", "motherlode", "map"],
  },
];

/** All reference entries — player.log events come from generated docs */
export const allRefEntries: RefEntry[] = [
  ...logFormats,
  ...generatedPlayerLogEvents,
  ...chatChannels,
  ...cdnReference,
  ...patterns,
];

/** All categories in display order */
export const refCategories = [
  "Log Formats",
  "Items & Inventory",
  "Skills & Abilities",
  "NPC Interaction",
  "Player Status",
  "Effects & Buffs",
  "Quests",
  "Combat",
  "Vendors",
  "World & UI",
  "Chat Channels",
  "CDN Data",
  "Event Patterns",
];
