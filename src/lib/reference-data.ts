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

// ─── Player.log Events ──────────────────────────────────────────

const playerLogEvents: RefEntry[] = [
  {
    name: "ProcessAddItem",
    category: "Items & Inventory",
    format: "[HH:MM:SS] LocalPlayer: ProcessAddItem(InternalName(instanceId), slotIndex, isNew)",
    description: "New item enters inventory. Builds the instance ID to item name mapping at login.",
    whenItFires: [
      "Login — all inventory items with isNew=False",
      "Looting items from ground or containers",
      "Crafting results",
      "Receiving items from NPCs/quests",
      "Item entering inventory as a new stack",
    ],
    fields: [
      { name: "InternalName", type: "string", description: "CDN internal name (e.g., MetalSlab2)" },
      { name: "instanceId", type: "u64", description: "Unique instance identifier for this stack/item" },
      { name: "slotIndex", type: "i32", description: "Inventory slot (-1 = auto-placed)" },
      { name: "isNew", type: "bool", description: "True if newly acquired, False if loading inventory" },
    ],
    notes: ["At login, every inventory item fires with isNew=False"],
    tags: ["item", "inventory", "loot", "craft"],
  },
  {
    name: "ProcessUpdateItemCode",
    category: "Items & Inventory",
    format: "[HH:MM:SS] LocalPlayer: ProcessUpdateItemCode(instanceId, encodedValue, fromServer)",
    description: "Existing stack updated. The encodedValue packs stack size and item type ID.",
    whenItFires: [
      "Adding items to an existing stack",
      "Consuming items from a stack (crafting, consumables)",
      "Moving items between inventory and storage",
    ],
    fields: [
      { name: "instanceId", type: "u64", description: "Instance identifier (same as ProcessAddItem)" },
      { name: "encodedValue", type: "u32", description: "Packed: (stackSize << 16) | itemTypeId" },
      { name: "fromServer", type: "bool", description: "True = server update, False = client-side move" },
    ],
    notes: [
      "Decode: stackSize = value >> 16, itemTypeId = value & 0xFFFF",
      "Track deltas: newStackSize - previousStackSize gives items gained/lost",
    ],
    tags: ["item", "stack", "inventory", "quantity"],
  },
  {
    name: "ProcessDeleteItem",
    category: "Items & Inventory",
    format: "[HH:MM:SS] LocalPlayer: ProcessDeleteItem(instanceId)",
    description: "Item removed from inventory. Could be consumed, destroyed, or moved to storage.",
    whenItFires: [
      "Stack fully consumed (last item used)",
      "Item moved to storage (paired with ProcessAddToStorageVault)",
      "Item destroyed or quest-consumed",
    ],
    fields: [
      { name: "instanceId", type: "u64", description: "Instance identifier being removed" },
    ],
    notes: ["Check for a following ProcessAddToStorageVault to distinguish storage transfer from deletion"],
    tags: ["item", "delete", "consume", "storage"],
  },
  {
    name: "ProcessAddToStorageVault",
    category: "Items & Inventory",
    format: "[HH:MM:SS] LocalPlayer: ProcessAddToStorageVault(npcId, -1, slot, InternalName(instanceId))",
    description: "Item moved to NPC storage vault. When preceded by ProcessDeleteItem with the same instanceId, the item was stowed.",
    fields: [
      { name: "npcId", type: "u32", description: "Storage NPC entity ID" },
      { name: "slot", type: "i32", description: "Storage vault slot" },
      { name: "InternalName", type: "string", description: "Item internal name" },
      { name: "instanceId", type: "u64", description: "Item instance ID" },
    ],
    tags: ["item", "storage", "vault", "stow"],
  },
  {
    name: "ProcessLoadSkills",
    category: "Skills & Abilities",
    format: "[HH:MM:SS] LocalPlayer: ProcessLoadSkills({type=Name,raw=R,bonus=B,xp=X,tnl=T,max=M}, ...)",
    description: "Full skill snapshot. Contains every skill the player has, including those at level 0.",
    whenItFires: ["Login", "Zone changes / reloads"],
    fields: [
      { name: "type", type: "string", description: "Internal skill name (e.g., Hammer, Mentalism)" },
      { name: "raw", type: "u32", description: "Base skill level (without bonus)" },
      { name: "bonus", type: "u32", description: "Bonus levels from gear/buffs" },
      { name: "xp", type: "u32", description: "Current XP within the level" },
      { name: "tnl", type: "i32", description: "XP to next level (-1 = at cap)" },
      { name: "max", type: "u32", description: "Maximum achievable level" },
    ],
    notes: [
      "Effective level = raw + bonus",
      "tnl=-1 means skill is at its maximum cap",
      "Meta-skills like Anatomy appear with raw=0 and bonus from highest sub-skill",
    ],
    tags: ["skill", "level", "xp", "snapshot"],
  },
  {
    name: "ProcessUpdateSkill",
    category: "Skills & Abilities",
    format: "[HH:MM:SS] LocalPlayer: ProcessUpdateSkill(...)",
    description: "Single skill XP or level update during gameplay.",
    tags: ["skill", "xp", "level"],
  },
  {
    name: "ProcessStartInteraction",
    category: "NPC Interaction",
    format: '[HH:MM:SS] LocalPlayer: ProcessStartInteraction(entityId, interactionType, distance, canInteract, "NPC_Name")',
    description: "Player begins interacting with an NPC or interactable entity.",
    fields: [
      { name: "entityId", type: "u32", description: "Entity ID" },
      { name: "interactionType", type: "u32", description: "7 = talk/vendor, 3 = saddlebag/storage" },
      { name: "distance", type: "f32", description: "Distance to entity (0 for self)" },
      { name: "canInteract", type: "bool", description: "Whether interaction is valid" },
      { name: "NPC_Name", type: "string", description: 'Internal NPC identifier (e.g., "NPC_Yetta")' },
    ],
    tags: ["npc", "interaction", "vendor", "talk"],
  },
  {
    name: "ProcessDeltaFavor",
    category: "NPC Interaction",
    format: '[HH:MM:SS] LocalPlayer: ProcessDeltaFavor(npcId, "NPC_Name", delta, isGift)',
    description: "NPC favor changed, usually from giving a gift.",
    fields: [
      { name: "npcId", type: "u32", description: "NPC entity ID" },
      { name: "NPC_Name", type: "string", description: "Internal NPC identifier" },
      { name: "delta", type: "f32", description: "Favor amount gained" },
      { name: "isGift", type: "bool", description: "True when favor is from a gift" },
    ],
    tags: ["npc", "favor", "gift"],
  },
  {
    name: "ProcessSetAttributes",
    category: "Player Status",
    format: '[HH:MM:SS] LocalPlayer: ProcessSetAttributes(entityId, "[KEY1, KEY2], [val1, val2]")',
    description: "Player attributes updated. Contains parallel key/value arrays. Can set 1 to hundreds of attributes at once.",
    whenItFires: [
      "Login — two massive dumps covering all character state",
      "Mount/dismount — re-dumps ~44 attributes",
      "Skill bar swap — stats affected by active skills",
      "During play — incremental updates",
    ],
    notes: [
      "Known categories: Vitals, Regen, Movement, Combat modifiers, Ability modifiers, NPC interaction, Social, Crafting, Mount, Equipment, Inventory, XP modifiers",
      "Examples: CUR_HEALTH, MAX_HEALTH, IS_MOUNTED, MOVEMENT_SPEED",
    ],
    tags: ["attribute", "stats", "health", "mount", "combat"],
  },
  {
    name: "ProcessSetWeather",
    category: "Player Status",
    format: '[HH:MM:SS] LocalPlayer: ProcessSetWeather("WeatherName", boolFlag)',
    description: "Weather condition changed. Relevant for weather-dependent recipes.",
    fields: [
      { name: "WeatherName", type: "string", description: 'Weather condition (e.g., "Clear Sky", "Cloudy 3")' },
      { name: "boolFlag", type: "bool", description: "Possibly indicates outdoor area" },
    ],
    tags: ["weather", "crafting"],
  },
  {
    name: "ProcessAddEffects",
    category: "Effects & Buffs",
    format: '[HH:MM:SS] LocalPlayer: ProcessAddEffects(entityId, sourceEntityId, "[effectId1, ...]", boolFlag)',
    description: "Buffs/effects applied. Effect IDs are numeric — use ProcessUpdateEffectName for display names.",
    whenItFires: [
      "Login — large batch with sourceEntityId=0, boolFlag=False",
      "During play — smaller batches with sourceEntityId=self, boolFlag=True",
    ],
    fields: [
      { name: "entityId", type: "u32", description: "Target entity (player)" },
      { name: "sourceEntityId", type: "u32", description: "Source (0 = system/login, self = self-buff)" },
      { name: "effectIds", type: "u32[]", description: "Numeric effect IDs" },
      { name: "boolFlag", type: "bool", description: "False on login, True during gameplay" },
    ],
    tags: ["effect", "buff", "debuff"],
  },
  {
    name: "ProcessRemoveEffects",
    category: "Effects & Buffs",
    format: "[HH:MM:SS] LocalPlayer: ProcessRemoveEffects(entityId, System.Int32[])",
    description: "Buffs/effects removed (expired or dispelled).",
    notes: ["Individual effect IDs cannot be extracted from this event"],
    tags: ["effect", "buff", "expire"],
  },
  {
    name: "ProcessUpdateEffectName",
    category: "Effects & Buffs",
    format: '[HH:MM:SS] LocalPlayer: ProcessUpdateEffectName(entityId, effectInstanceId, "Effect Name, Level N")',
    description: "Provides human-readable name for an applied effect.",
    fields: [
      { name: "entityId", type: "u32", description: "Player entity ID" },
      { name: "effectInstanceId", type: "u32", description: "Instance ID of the effect" },
      { name: "displayName", type: "string", description: 'Name with level (e.g., "Performance Appreciation, Level 0")' },
    ],
    tags: ["effect", "name", "buff"],
  },
  {
    name: "ProcessPlayerMount",
    category: "Player Status",
    format: "[HH:MM:SS] LocalPlayer: ProcessPlayerMount(entityId, isMounting)",
    description: "Player mounted or dismounted. Followed by attribute and skill bar updates.",
    fields: [
      { name: "entityId", type: "u32", description: "Player entity ID" },
      { name: "isMounting", type: "bool", description: "True = mounting, False = dismounting" },
    ],
    tags: ["mount", "ride"],
  },
  {
    name: "ProcessSetActiveSkills",
    category: "Skills & Abilities",
    format: "[HH:MM:SS] LocalPlayer: ProcessSetActiveSkills(Skill1, Skill2)",
    description: "Active skill bar changed.",
    whenItFires: ["Login", "Mount/dismount (swaps to Riding)", "Manual skill bar changes"],
    fields: [
      { name: "Skill1", type: "string", description: "Primary active skill" },
      { name: "Skill2", type: "string", description: "Secondary active skill" },
    ],
    tags: ["skill", "bar", "active"],
  },
  {
    name: "ProcessVendorScreen",
    category: "Vendors",
    format: "[HH:MM:SS] LocalPlayer: ProcessVendorScreen(...)",
    description: "Vendor shop screen opened. Shows NPC vendor inventory.",
    tags: ["vendor", "shop", "buy", "sell"],
  },
  {
    name: "ProcessVendorAddItem",
    category: "Vendors",
    format: "[HH:MM:SS] LocalPlayer: ProcessVendorAddItem(...)",
    description: "Item added to the vendor's displayed inventory.",
    tags: ["vendor", "item"],
  },
  {
    name: "ProcessLoadQuests",
    category: "Quests",
    format: "[HH:MM:SS] LocalPlayer: ProcessLoadQuests(...)",
    description: "Full quest log snapshot loaded.",
    whenItFires: ["Login", "Zone changes"],
    tags: ["quest", "load", "snapshot"],
  },
  {
    name: "ProcessUpdateQuest",
    category: "Quests",
    format: "[HH:MM:SS] LocalPlayer: ProcessUpdateQuest(entityId, TransitionalQuestState)",
    description: "Quest objective completed or quest state changed.",
    tags: ["quest", "objective", "progress"],
  },
  {
    name: "ProcessCompleteQuest",
    category: "Quests",
    format: "[HH:MM:SS] LocalPlayer: ProcessCompleteQuest(...)",
    description: "Quest completed successfully.",
    tags: ["quest", "complete", "finish"],
  },
  {
    name: "ProcessCombatModeStatus",
    category: "Combat",
    format: "[HH:MM:SS] LocalPlayer: ProcessCombatModeStatus(...)",
    description: "Combat mode entered or exited.",
    tags: ["combat", "mode", "aggro"],
  },
  {
    name: "ProcessAttack",
    category: "Combat",
    format: "[HH:MM:SS] LocalPlayer: ProcessAttack(...)",
    description: "Combat attack event.",
    tags: ["combat", "attack", "damage"],
  },
  {
    name: "ProcessDeathMessage",
    category: "Combat",
    format: "[HH:MM:SS] LocalPlayer: ProcessDeathMessage(...)",
    description: "Death event occurred (player or entity).",
    tags: ["combat", "death"],
  },
  {
    name: "ProcessMapFx",
    category: "World & UI",
    format: "[HH:MM:SS] LocalPlayer: ProcessMapFx(...)",
    description: "Map effect — used for survey results, motherlode markers, and POI indicators.",
    tags: ["map", "survey", "motherlode", "poi"],
  },
  {
    name: "ProcessScreenText",
    category: "World & UI",
    format: "[HH:MM:SS] LocalPlayer: ProcessScreenText(...)",
    description: "On-screen text notification (system messages, announcements).",
    tags: ["ui", "text", "notification"],
  },
  {
    name: "ProcessBook",
    category: "World & UI",
    format: "[HH:MM:SS] LocalPlayer: ProcessBook(...)",
    description: "Book or lore entry opened/read.",
    tags: ["book", "lore", "read"],
  },
];

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
  {
    name: "abilities.json",
    category: "CDN Data",
    description: "All ability definitions including damage, power cost, cooldown, and skill requirements.",
    tags: ["cdn", "abilities", "skills", "combat"],
  },
  {
    name: "items.json",
    category: "CDN Data",
    description: "All item definitions including names, descriptions, stats, and item type IDs.",
    notes: ["Item type IDs from ProcessUpdateItemCode map to entries here"],
    tags: ["cdn", "items", "equipment", "inventory"],
  },
  {
    name: "skills.json",
    category: "CDN Data",
    description: "Skill definitions including level caps, advancement hints, rewards, and recipe ingredient keywords.",
    tags: ["cdn", "skills", "levels", "progression"],
  },
  {
    name: "recipes.json",
    category: "CDN Data",
    description: "Crafting recipe definitions with ingredients, results, and skill requirements.",
    tags: ["cdn", "recipes", "crafting"],
  },
  {
    name: "npcs.json",
    category: "CDN Data",
    description: "NPC definitions including names, locations, and services offered.",
    tags: ["cdn", "npcs", "vendors"],
  },
  {
    name: "effects.json",
    category: "CDN Data",
    description: "Effect/buff definitions. Effect IDs from ProcessAddEffects map to entries here.",
    tags: ["cdn", "effects", "buffs", "debuffs"],
  },
  {
    name: "quests.json",
    category: "CDN Data",
    description: "Quest definitions with objectives, rewards, and requirements.",
    tags: ["cdn", "quests"],
  },
  {
    name: "areas.json",
    category: "CDN Data",
    description: "Game area/zone definitions with friendly names.",
    tags: ["cdn", "areas", "zones", "maps"],
  },
  {
    name: "attributes.json",
    category: "CDN Data",
    description: "Attribute definitions for the values seen in ProcessSetAttributes.",
    tags: ["cdn", "attributes", "stats"],
  },
  {
    name: "storagevaults.json",
    category: "CDN Data",
    description: "Storage vault definitions per NPC, with slot counts and requirements.",
    tags: ["cdn", "storage", "vaults"],
  },
];

// ─── Practical Patterns ─────────────────────────────────────────

const patterns: RefEntry[] = [
  {
    name: "Selling to Vendors",
    category: "Event Patterns",
    description: "When selling an item to an NPC vendor, look for ProcessDeleteItem followed by ProcessVendorAddItem with the same item.",
    notes: [
      "ProcessDeleteItem(instanceId) — item leaves inventory",
      "ProcessVendorAddItem — item appears in vendor's stock",
      "Gold change shown via ProcessSetAttributes",
    ],
    tags: ["pattern", "sell", "vendor", "gold"],
  },
  {
    name: "Gift Giving",
    category: "Event Patterns",
    description: "Giving gifts to NPCs follows a specific event sequence for tracking favor gains.",
    notes: [
      "ProcessPromptForItem — gift UI opens",
      "ProcessDeleteItem — gift item consumed",
      "ProcessDeltaFavor — favor gained (delta varies per item)",
      "ProcessUpdateQuest — if favor crosses a threshold",
    ],
    tags: ["pattern", "gift", "favor", "npc"],
  },
  {
    name: "Storage Transfer",
    category: "Event Patterns",
    description: "Moving items to/from storage vaults. Distinguish from real deletion by checking for vault events.",
    notes: [
      "Stowing: ProcessDeleteItem → ProcessAddToStorageVault (same instanceId)",
      "Retrieving: ProcessRemoveFromStorageVault → ProcessAddItem",
      "Bulk stow can produce many pairs in sequence",
    ],
    tags: ["pattern", "storage", "vault", "stow", "retrieve"],
  },
  {
    name: "Crafting Consumption",
    category: "Event Patterns",
    description: "When crafting consumes ingredients, look for stack decrements or deletions followed by recipe completion.",
    notes: [
      "ProcessUpdateItemCode — ingredient stack decremented (delta < 0)",
      "ProcessDeleteItem — ingredient fully consumed (last in stack)",
      "ProcessRecipeComplete — recipe finishes",
      "ProcessAddItem — crafting result enters inventory",
    ],
    tags: ["pattern", "craft", "recipe", "consume"],
  },
  {
    name: "Motherlode Survey",
    category: "Event Patterns",
    description: "Using a survey/motherlode map to find a resource node.",
    notes: [
      "ProcessMapFx — compass/map marker appears",
      "Player navigates to location",
      "ProcessDeleteItem — map consumed on success",
      "ProcessAddItem — surveyed resource enters inventory",
    ],
    tags: ["pattern", "survey", "motherlode", "map"],
  },
];

/** All reference entries */
export const allRefEntries: RefEntry[] = [
  ...logFormats,
  ...playerLogEvents,
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
