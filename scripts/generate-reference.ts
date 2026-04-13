/**
 * generate-reference.ts
 *
 * Parses docs/log-parsing/player-log-events.md and generates
 * src/lib/generated/reference-entries.ts — the single source of truth
 * for all event reference data used by the app (tooltips + reference pane).
 *
 * Run: npx tsx scripts/generate-reference.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

interface RefField {
  name: string;
  type: string;
  description: string;
}

interface ParsedEvent {
  name: string;
  summary: string;
  category: string;
  format: string | null;
  description: string;
  fields: RefField[];
  whenItFires: string[];
  notes: string[];
  tags: string[];
}

/** Map from doc file # title → default category for events in that file */
const TITLE_CATEGORY_MAP: Record<string, string> = {
  "Items & Inventory Events": "Items & Inventory",
  "Skills & Abilities Events": "Skills & Abilities",
  "NPC Interaction Events": "NPC Interaction",
  "Player Status Events": "Player Status",
  "Effects & Buffs Events": "Effects & Buffs",
  "Quest Events": "Quests",
  "Storage Events": "Items & Inventory",
  "Vendor Events": "Vendors",
  "World & UI Events": "World & UI",
  "Practical Patterns": "Event Patterns",
  "Player-to-Player Interaction Events": "P2P Interaction",
  "Engine & Rendering Events": "Engine & Rendering",
  "Non-Process Timestamped Events": "Non-Process Events",
  "Startup & System Lines": "Startup & System",
  // Legacy monolithic file
  "Player.log Event Reference": "Items & Inventory",
};

// Map event names to categories
const EVENT_CATEGORY: Record<string, string> = {
  ProcessAddItem: "Items & Inventory",
  ProcessUpdateItemCode: "Items & Inventory",
  ProcessDeleteItem: "Items & Inventory",
  ProcessAddToStorageVault: "Items & Inventory",
  ProcessShowStorageVault: "Items & Inventory",
  ProcessRefreshStorageVault: "Items & Inventory",
  ProcessRemoveFromStorageVault: "Items & Inventory",
  ProcessLoadSkills: "Skills & Abilities",
  ProcessUpdateSkill: "Skills & Abilities",
  ProcessSetActiveSkills: "Skills & Abilities",
  ProcessLoadAbilities: "Skills & Abilities",
  ProcessLoadRecipes: "Skills & Abilities",
  ProcessUpdateRecipe: "Skills & Abilities",
  ProcessSetStarredRecipes: "Skills & Abilities",
  ProcessRecipeComplete: "Skills & Abilities",
  ProcessStartInteraction: "NPC Interaction",
  ProcessWaitInteraction: "NPC Interaction",
  ProcessEndInteraction: "NPC Interaction",
  ProcessPreTalkScreen: "NPC Interaction",
  ProcessTalkScreen: "NPC Interaction",
  ProcessPromptForItem: "NPC Interaction",
  ProcessDeltaFavor: "NPC Interaction",
  ProcessFirstEverInteraction: "NPC Interaction",
  ProcessBarterScreen: "NPC Interaction",
  ProcessSetAttributes: "Player Status",
  ProcessSetWeather: "Player Status",
  ProcessPlayerMount: "Player Status",
  ProcessAddEffects: "Effects & Buffs",
  ProcessRemoveEffects: "Effects & Buffs",
  ProcessUpdateEffectName: "Effects & Buffs",
  ProcessLoadQuests: "Quests",
  ProcessAddQuest: "Quests",
  ProcessUpdateQuest: "Quests",
  ProcessCompleteQuest: "Quests",
  ProcessSelectQuest: "Quests",
  ProcessCompleteDirectedGoals: "Quests",
  ProcessCombatModeStatus: "Combat",
  ProcessAttack: "Combat",
  ProcessDeathMessage: "Combat",
  ProcessVendorScreen: "Vendors",
  ProcessVendorAddItem: "Vendors",
  ProcessVendorUpdateItem: "Vendors",
  ProcessVendorUpdateAvailableGold: "Vendors",
  ProcessPlayerVendorScreen: "Vendors",
  ProcessMapFx: "World & UI",
  ProcessSetAreaSettings: "World & UI",
  ProcessScreenText: "World & UI",
  ProcessBook: "World & UI",
  ProcessBookList: "World & UI",
  ProcessSetEquippedItems: "Player Status",
  ProcessShowStable: "World & UI",
  ProcessExtendedItemUseInfo: "Items & Inventory",
  ProcessToolCommandResponse: "World & UI",
  ProcessRemoveLoot: "Items & Inventory",
  ProcessSetRecipeReuseTimers: "Skills & Abilities",
  // Pets
  ProcessSetPetOwner: "Player Status",
  ProcessSetPetCombatMode: "Player Status",
  // Abilities
  ProcessAddAbility: "Skills & Abilities",
  // Gear preview
  ProcessPreviewGear: "World & UI",
  ProcessCommand: "World & UI",
  // P2P
  ProcessP2PStartInteraction: "P2P Interaction",
  ProcessP2PRequestInteraction: "P2P Interaction",
  ProcessP2PSetTrade: "P2P Interaction",
  ProcessP2PEndInteraction: "P2P Interaction",
  // Engine
  ProcessNewPosition: "Engine & Rendering",
  ProcessEmote: "Engine & Rendering",
  ProcessDepuppetEntity: "Engine & Rendering",
  ProcessEntitySpeech: "Engine & Rendering",
  ProcessMouseEvent: "Engine & Rendering",
  ProcessMousePress: "Engine & Rendering",
  ProcessNewAnimation: "Engine & Rendering",
  ProcessWalkTo: "Engine & Rendering",
};

// Tags by category
const CATEGORY_TAGS: Record<string, string[]> = {
  "Items & Inventory": ["item", "inventory"],
  "Skills & Abilities": ["skill", "ability"],
  "NPC Interaction": ["npc", "interaction"],
  "Player Status": ["status", "attribute"],
  "Effects & Buffs": ["effect", "buff"],
  Quests: ["quest"],
  Combat: ["combat"],
  Vendors: ["vendor", "shop"],
  "World & UI": ["ui", "world"],
  "P2P Interaction": ["p2p", "trade", "group"],
  "Engine & Rendering": ["engine", "rendering", "internal"],
  "Non-Process Events": ["combat", "ability", "network", "audio", "rendering"],
  "Startup & System": ["startup", "init", "system", "engine"],
};

function parseMarkdown(content: string, fileDefaultCategory?: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  // Split on ### headers
  const sections = content.split(/^### /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");

    // First line: "EventName — Summary" or "EventName — Summary text"
    const headerLine = lines[0].trim();
    const headerMatch = headerLine.match(/^(\w+)\s*(?:—|--)\s*(.+)$/);
    if (!headerMatch) continue;

    const [, name, summary] = headerMatch;
    const category = EVENT_CATEGORY[name] ?? fileDefaultCategory ?? "Other";

    // Parse the rest of the section
    let format: string | null = null;
    const fields: RefField[] = [];
    const whenItFires: string[] = [];
    const notes: string[] = [];

    let i = 1;
    let inCodeBlock = false;
    let codeBlockContent = "";
    let inFieldTable = false;
    let inWhenItFires = false;
    let collectingNotes = false;
    let description = summary;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.trim() === "```") {
        if (inCodeBlock) {
          // End of code block — first code block is the format
          if (!format) {
            format = codeBlockContent.trim();
          }
          inCodeBlock = false;
          codeBlockContent = "";
        } else {
          inCodeBlock = true;
        }
        i++;
        continue;
      }
      if (inCodeBlock) {
        codeBlockContent += line + "\n";
        i++;
        continue;
      }

      // Field tables: | `name` | type | description |
      const fieldMatch = line.match(/^\|\s*`(\w+)`\s*\|\s*(\w[\w\[\]]*)\s*\|\s*(.+?)\s*\|$/);
      if (fieldMatch) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2],
          description: fieldMatch[3],
        });
        inFieldTable = true;
        i++;
        continue;
      }
      // Table header/separator
      if (line.match(/^\|[-\s|]+\|$/) || line.match(/^\|\s*Field\s*\|/)) {
        inFieldTable = true;
        i++;
        continue;
      }
      if (inFieldTable && !line.startsWith("|")) {
        inFieldTable = false;
      }

      // **When it fires:** section
      if (line.match(/^\*\*When it fires:?\*\*/)) {
        inWhenItFires = true;
        collectingNotes = false;
        i++;
        continue;
      }
      if (inWhenItFires && line.match(/^- /)) {
        whenItFires.push(line.replace(/^- /, "").replace(/`/g, "").trim());
        i++;
        continue;
      }
      if (inWhenItFires && !line.match(/^- /) && line.trim() !== "") {
        inWhenItFires = false;
      }

      // Notes: **Key behavior:** **Important:** **Tracking deltas:** etc.
      const noteMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (noteMatch && !noteMatch[1].match(/When it fires/)) {
        const noteText = noteMatch[2].replace(/`/g, "").trim();
        if (noteText) {
          notes.push(noteText);
        }
        collectingNotes = false;
        i++;
        continue;
      }

      // Paragraph text after header — could be extra description
      if (line.trim() && !line.startsWith("|") && !line.startsWith("#") && !line.startsWith("**") && !line.startsWith("-") && !inFieldTable) {
        // Skip #### sub-headers
        if (!line.startsWith("####")) {
          // Additional description text
          const clean = line.replace(/`/g, "").trim();
          if (clean && description === summary) {
            description = clean;
          }
        }
      }

      i++;
    }

    const baseTags = CATEGORY_TAGS[category] ?? [];
    const nameTags = name.replace(/^Process/, "").replace(/([A-Z])/g, " $1").trim().toLowerCase().split(/\s+/);

    events.push({
      name,
      summary,
      category,
      format,
      description: description || summary,
      fields,
      whenItFires,
      notes,
      tags: [...new Set([...baseTags, ...nameTags])],
    });
  }

  return events;
}

function generateTypeScript(events: ParsedEvent[]): string {
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED — do not edit manually");
  lines.push("// Source: docs/log-parsing/*.md");
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push("// Run: npm run generate-reference");
  lines.push("");
  lines.push('import type { RefEntry } from "../reference-data";');
  lines.push('import type { EventInfo } from "../event-reference";');
  lines.push("");
  lines.push("/** Player.log events parsed from docs */");
  lines.push("export const generatedPlayerLogEvents: RefEntry[] = " + JSON.stringify(
    events.map((e) => ({
      name: e.name,
      category: e.category,
      format: e.format,
      description: e.description,
      whenItFires: e.whenItFires.length > 0 ? e.whenItFires : undefined,
      notes: e.notes.length > 0 ? e.notes : undefined,
      fields: e.fields.length > 0 ? e.fields : undefined,
      tags: e.tags,
    })),
    null,
    2
  ) + ";");

  lines.push("");
  lines.push("/** Tooltip data derived from docs */");
  lines.push("export const generatedEventInfoMap: Map<RegExp, EventInfo> = new Map([");
  for (const e of events) {
    const escapedName = e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fieldsStr = e.fields.length > 0
      ? JSON.stringify(e.fields.map((f) => f.name))
      : "undefined";
    lines.push(`  [/${escapedName}/, { name: ${JSON.stringify(e.name)}, summary: ${JSON.stringify(e.summary)}, fields: ${fieldsStr} }],`);
  }
  lines.push("]);");

  return lines.join("\n") + "\n";
}

// Main
const projectRoot = join(import.meta.dirname!, "..");
const docsDir = join(projectRoot, "docs", "log-parsing");
const outDir = join(projectRoot, "src", "lib", "generated");
const outPath = join(outDir, "reference-entries.ts");

const SKIP_FILES = new Set(["log-todo.md"]);

const allEvents: ParsedEvent[] = [];

const mdFiles = readdirSync(docsDir)
  .filter((f) => f.endsWith(".md") && !SKIP_FILES.has(f))
  .sort();

for (const file of mdFiles) {
  const filePath = join(docsDir, file);
  console.log("Reading", file);
  const markdown = readFileSync(filePath, "utf-8");

  // Extract the # title to determine default category
  const titleMatch = markdown.match(/^# (.+)$/m);
  const title = titleMatch?.[1] ?? "";
  const fileCategory = TITLE_CATEGORY_MAP[title];

  const events = parseMarkdown(markdown, fileCategory);
  console.log(`  → ${events.length} events`);
  allEvents.push(...events);
}

console.log(`Total: ${allEvents.length} events from ${mdFiles.length} files`);

mkdirSync(outDir, { recursive: true });
const output = generateTypeScript(allEvents);
writeFileSync(outPath, output, "utf-8");
console.log("Wrote", outPath);
