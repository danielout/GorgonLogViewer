import type { FilterConfig } from "./types";

const STORAGE_KEY = "glv-filter-configs";

/** Built-in filter configs that ship with the app */
export const builtInConfigs: FilterConfig[] = [
  {
    name: "All Events",
    id: "builtin-all",
    enabledTypes: null,
    highlights: [],
  },
  {
    name: "Chat Only",
    id: "builtin-chat",
    enabledTypes: [
      "chat-global", "chat-help", "chat-nearby", "chat-guild",
      "chat-trade", "chat-party", "chat-tell", "chat-custom",
    ],
    highlights: [],
  },
  {
    name: "Items & Inventory",
    id: "builtin-items",
    enabledTypes: ["item", "vendor"],
    highlights: [
      { name: "New items", pattern: "isNew=True", isRegex: false, color: "#a6e3a1", enabled: true },
      { name: "Deletions", pattern: "ProcessDeleteItem", isRegex: false, color: "#f38ba8", enabled: true },
    ],
  },
  {
    name: "Skills & Crafting",
    id: "builtin-skills",
    enabledTypes: ["skill", "item"],
    highlights: [
      { name: "Recipe complete", pattern: "ProcessRecipeComplete", isRegex: false, color: "#a6e3a1", enabled: true },
      { name: "Skill update", pattern: "ProcessUpdateSkill", isRegex: false, color: "#89b4fa", enabled: true },
    ],
  },
  {
    name: "NPC Interaction",
    id: "builtin-npc",
    enabledTypes: ["interaction", "quest"],
    highlights: [
      { name: "Favor gained", pattern: "ProcessDeltaFavor", isRegex: false, color: "#a6e3a1", enabled: true },
    ],
  },
  {
    name: "Combat & Effects",
    id: "builtin-combat",
    enabledTypes: ["combat", "effect", "attribute"],
    highlights: [
      { name: "Death", pattern: "ProcessDeathMessage", isRegex: false, color: "#f38ba8", enabled: true },
    ],
  },
];

export function loadUserConfigs(): FilterConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FilterConfig[];
  } catch {
    return [];
  }
}

export function saveUserConfigs(configs: FilterConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getAllConfigs(): FilterConfig[] {
  return [...builtInConfigs, ...loadUserConfigs()];
}

export function exportConfig(config: FilterConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importConfig(json: string): FilterConfig | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.name || !parsed.id) return null;
    return {
      name: parsed.name,
      id: `imported-${Date.now()}`,
      enabledTypes: parsed.enabledTypes ?? null,
      highlights: parsed.highlights ?? [],
    };
  } catch {
    return null;
  }
}

let idCounter = 0;

export function createEmptyConfig(): FilterConfig {
  return {
    name: "New Config",
    id: `user-${Date.now()}-${idCounter++}`,
    enabledTypes: null,
    highlights: [],
  };
}
