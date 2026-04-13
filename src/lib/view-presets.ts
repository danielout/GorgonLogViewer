import type { ViewPreset } from "./types";

const STORAGE_KEY = "glv-view-presets";

export function loadPresets(): ViewPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ViewPreset[];
  } catch {
    return [];
  }
}

export function savePresets(presets: ViewPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

let idCounter = 0;

export function createPresetId(): string {
  return `preset-${Date.now()}-${idCounter++}`;
}

export function exportPreset(preset: ViewPreset): string {
  return JSON.stringify(preset, null, 2);
}

export function importPreset(json: string): ViewPreset | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.name) return null;
    return {
      name: parsed.name,
      id: createPresetId(),
      search: parsed.search ?? "",
      isRegex: parsed.isRegex ?? false,
      enabledTypes: parsed.enabledTypes ?? [],
      timeFrom: parsed.timeFrom ?? "",
      timeTo: parsed.timeTo ?? "",
      entityId: parsed.entityId ?? "",
      filterConfigId: parsed.filterConfigId ?? null,
    };
  } catch {
    return null;
  }
}
