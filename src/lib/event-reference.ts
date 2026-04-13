import type { LogLineType } from "./types";

export interface EventInfo {
  name: string;
  summary: string;
  fields?: string[];
}

/** Player.log event pattern → reference info */
const PLAYER_EVENT_INFO: [RegExp, EventInfo][] = [
  [/ProcessAddItem/, {
    name: "ProcessAddItem",
    summary: "New item enters inventory. isNew=False at login (inventory load), True during gameplay (loot/craft/quest).",
    fields: ["InternalName", "instanceId", "slotIndex", "isNew"],
  }],
  [/ProcessUpdateItemCode/, {
    name: "ProcessUpdateItemCode",
    summary: "Existing stack updated. encodedValue packs stack size (high 16 bits) and item type ID (low 16 bits).",
    fields: ["instanceId", "encodedValue", "fromServer"],
  }],
  [/ProcessDeleteItem/, {
    name: "ProcessDeleteItem",
    summary: "Item removed from inventory. Check for a following ProcessAddToStorageVault to distinguish storage transfer from deletion.",
    fields: ["instanceId"],
  }],
  [/ProcessAddToStorageVault/, {
    name: "ProcessAddToStorageVault",
    summary: "Item moved to NPC storage vault. When preceded by ProcessDeleteItem with same instanceId, the item was stowed, not destroyed.",
    fields: ["npcId", "-1", "slot", "InternalName(instanceId)"],
  }],
  [/ProcessLoadSkills/, {
    name: "ProcessLoadSkills",
    summary: "Full skill snapshot. Fires at login and zone changes. Effective level = raw + bonus. tnl=-1 means skill is at cap.",
    fields: ["type", "raw", "bonus", "xp", "tnl", "max"],
  }],
  [/ProcessUpdateSkill/, {
    name: "ProcessUpdateSkill",
    summary: "Single skill XP/level update during gameplay.",
  }],
  [/ProcessRecipeComplete/, {
    name: "ProcessRecipeComplete",
    summary: "A crafting recipe was completed successfully.",
  }],
  [/ProcessStartInteraction/, {
    name: "ProcessStartInteraction",
    summary: "Player begins interacting with an entity. Type 7 = NPC talk/vendor, Type 3 = saddlebag/storage.",
    fields: ["entityId", "interactionType", "distance", "canInteract", "NPC_Name"],
  }],
  [/ProcessDeltaFavor/, {
    name: "ProcessDeltaFavor",
    summary: "NPC favor changed (usually from gifting). Delta varies per item given.",
    fields: ["npcId", "NPC_Name", "delta", "isGift"],
  }],
  [/ProcessSetAttributes/, {
    name: "ProcessSetAttributes",
    summary: "Player attributes updated. Fires large batches at login/mount, small updates during play. Contains parallel key/value arrays.",
    fields: ["entityId", "keys[]", "values[]"],
  }],
  [/ProcessSetWeather/, {
    name: "ProcessSetWeather",
    summary: "Weather condition changed. Relevant for weather-dependent recipes (e.g., Fletching in clear weather).",
    fields: ["WeatherName", "boolFlag"],
  }],
  [/ProcessAddEffects/, {
    name: "ProcessAddEffects",
    summary: "Buffs/effects applied. sourceEntityId=0 at login, self-ID during play. Effect IDs are numeric.",
    fields: ["entityId", "sourceEntityId", "effectIds[]", "boolFlag"],
  }],
  [/ProcessRemoveEffects/, {
    name: "ProcessRemoveEffects",
    summary: "Buffs/effects removed (expired or dispelled).",
    fields: ["entityId"],
  }],
  [/ProcessPlayerMount/, {
    name: "ProcessPlayerMount",
    summary: "Player mounted or dismounted. Followed by attribute and skill bar updates.",
    fields: ["entityId", "isMounting"],
  }],
  [/ProcessSetActiveSkills/, {
    name: "ProcessSetActiveSkills",
    summary: "Active skill bar changed. Fires on login, mount/dismount, and manual swaps.",
    fields: ["Skill1", "Skill2"],
  }],
  [/ProcessPromptForItem/, {
    name: "ProcessPromptForItem",
    summary: "NPC opened the gift-giving UI. Fires initially and after each gift given.",
    fields: ["npcId", "actionType", "dialogue", "prompt", "NPC_Name"],
  }],
  [/ProcessTalkScreen/, {
    name: "ProcessTalkScreen",
    summary: "NPC dialogue text displayed.",
    fields: ["npcId", "dialogueText"],
  }],
];

/** Chat log channel → reference info */
const CHAT_CHANNEL_INFO: Record<string, EventInfo> = {
  Global: { name: "Global Chat", summary: "Server-wide chat channel visible to all players." },
  Help: { name: "Help Chat", summary: "Help channel for player questions and answers." },
  Nearby: { name: "Nearby Chat", summary: "Local area chat, visible to players in proximity." },
  Guild: { name: "Guild Chat", summary: "Private guild member channel." },
  Trade: { name: "Trade Chat", summary: "Channel for buy/sell/trade offers." },
  Party: { name: "Party Chat", summary: "Private party/group member channel." },
  Combat: { name: "Combat", summary: "Combat events: damage dealt/received, healing, deaths." },
  Status: { name: "Status", summary: "System status messages (e.g., tracking compass updates, item locations)." },
  "NPC Chatter": { name: "NPC Chatter", summary: "Ambient NPC dialogue and reactions." },
  "Action Emotes": { name: "Action Emotes", summary: "Player emote actions (e.g., /bow, /wave, burying corpses)." },
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

  // Player.log events
  for (const [pattern, info] of PLAYER_EVENT_INFO) {
    if (pattern.test(content)) return info;
  }

  return null;
}
