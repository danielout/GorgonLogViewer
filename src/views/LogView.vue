<template>
  <div v-if="activeFileData" class="flex flex-col h-full">
    <template v-if="activeFileData.kind === 'json'">
      <div class="flex items-center gap-2 px-4 py-2 bg-bg-secondary border-b border-border">
        <button
          class="text-sm px-3 py-1 rounded border transition-colors"
          :class="jsonViewMode === 'tree' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-surface text-text-secondary hover:text-text-primary'"
          @click="jsonViewMode = 'tree'"
        >
          Tree
        </button>
        <button
          class="text-sm px-3 py-1 rounded border transition-colors"
          :class="jsonViewMode === 'schema' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-surface text-text-secondary hover:text-text-primary'"
          @click="jsonViewMode = 'schema'"
        >
          Schema
        </button>
      </div>
      <JsonViewer v-if="jsonViewMode === 'tree'" :content="activeFileData.rawContent" />
      <CdnSchemaView v-else-if="cdnSchema" :schema="cdnSchema" />
    </template>
    <template v-else>
      <FilterBar
        ref="filterBarRef"
        :total-count="activeFileData.lines.length"
        :filtered-count="filteredLines.length"
        :tailing="activeFileData.tailing"
        :available-types="availableTypes"
        :available-events="availableEvents"
        :current-line="currentLine"
        :current-timestamp="currentTimestamp"
        @filter="onFilter"
        @toggle-tailing="toggleTailing(activeFileData!.path)"
        @toggle-config="showConfigPanel = !showConfigPanel"
        @save-preset="onSavePreset"
        @load-preset="onLoadPreset"
        @goto-line="onGotoLine"
        @time-display-change="timeDisplay = $event"
      />
      <div class="flex flex-1 min-h-0">
        <LogViewer
          ref="logViewerRef"
          class="flex-1"
          :lines="filteredLines"
          :search-pattern="searchPattern"
          :highlight-rules="activeHighlightRules"
          :auto-scroll="activeFileData.tailing"
          :newest-first="filter.newestFirst"
          :time-display="timeDisplay"
          :timezone-offset-ms="activeFileData.timezoneOffsetMs"
          @open-reference="openReference($event)"
          @position-change="onPositionChange"
          @set-time-from="filterBarRef?.setTimeFrom($event)"
          @set-time-to="filterBarRef?.setTimeTo($event)"
        />
        <FilterConfigPanel
          v-if="showConfigPanel"
          @close="showConfigPanel = false"
          @apply="onApplyConfig"
        />
      </div>
    </template>
  </div>
  <div v-else class="flex-1 flex items-center justify-center text-text-muted">
    <div class="text-center">
      <p class="text-lg mb-2">No file open</p>
      <p class="text-sm">Use the sidebar to open a log file</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, nextTick } from "vue";
import type { OpenFile, FilterState, FilterConfig, HighlightRule, ViewPreset, LogLine, LogLineType } from "../lib/types";
import { analyzeCdnSchema } from "../lib/cdn-schema";
import { loadPresets, savePresets, createPresetId } from "../lib/view-presets";
import { getAllConfigs } from "../lib/filter-config";
import FilterBar from "../components/FilterBar.vue";
import LogViewer from "../components/LogViewer.vue";
import JsonViewer from "../components/JsonViewer.vue";
import CdnSchemaView from "../components/CdnSchemaView.vue";
import FilterConfigPanel from "../components/FilterConfigPanel.vue";

const props = defineProps<{
  activeFile: string | null;
  openFiles: OpenFile[];
}>();

const openReference = inject<(name: string) => void>("openReference", () => {});
const toggleTailing = inject<(path: string) => void>("toggleTailing", () => {});

const jsonViewMode = ref<"tree" | "schema">("tree");
const showConfigPanel = ref(false);
const activeConfig = ref<FilterConfig | null>(null);
const filterBarRef = ref<InstanceType<typeof FilterBar> | null>(null);
const logViewerRef = ref<InstanceType<typeof LogViewer> | null>(null);
const currentLine = ref<number | null>(null);
const currentTimestamp = ref<string | null>(null);
const timeDisplay = ref<"utc" | "local">("utc");

function onPositionChange(lineNumber: number | null, timestamp: string | null) {
  currentLine.value = lineNumber;
  currentTimestamp.value = timestamp;
}

const cdnSchema = computed(() => {
  if (!activeFileData.value || activeFileData.value.kind !== "json") return null;
  try {
    const data = JSON.parse(activeFileData.value.rawContent);
    return analyzeCdnSchema(data, activeFileData.value.name);
  } catch {
    return null;
  }
});

const filter = ref<FilterState>({
  search: "",
  isRegex: false,
  enabledTypes: new Set(),
  timeFrom: null,
  timeTo: null,
  entityId: "",
  disabledEvents: new Set(),
  newestFirst: false,
});

const activeFileData = computed(() =>
  props.openFiles.find((f) => f.path === props.activeFile) ?? null
);

const availableTypes = computed<LogLineType[]>(() => {
  if (!activeFileData.value) return [];
  const types = new Set<LogLineType>();
  for (const line of activeFileData.value.lines) {
    types.add(line.type);
  }
  return [...types].sort();
});

const availableEvents = computed<Map<LogLineType, Set<string>>>(() => {
  const map = new Map<LogLineType, Set<string>>();
  if (!activeFileData.value) return map;
  for (const line of activeFileData.value.lines) {
    const name = line.eventName ?? "(unclassified)";
    if (!map.has(line.type)) map.set(line.type, new Set());
    map.get(line.type)!.add(name);
  }
  return map;
});

const activeHighlightRules = computed<HighlightRule[]>(() => {
  if (!activeConfig.value) return [];
  return activeConfig.value.highlights.filter((r) => r.enabled && r.pattern);
});

const searchPattern = computed<RegExp | null>(() => {
  if (!filter.value.search) return null;
  try {
    if (filter.value.isRegex) {
      return new RegExp(filter.value.search, "gi");
    }
    return new RegExp(escapeRegex(filter.value.search), "gi");
  } catch {
    return null;
  }
});

const filteredLines = computed<LogLine[]>(() => {
  if (!activeFileData.value) return [];
  let lines = activeFileData.value.lines;

  // Event-level filter (disabled events)
  const disabled = filter.value.disabledEvents;
  if (disabled.size > 0) {
    lines = lines.filter((l) => {
      const name = l.eventName ?? "(unclassified)";
      return !disabled.has(name);
    });
  }

  // Config type restriction
  const configTypes = activeConfig.value?.enabledTypes;
  if (configTypes && configTypes.length > 0) {
    const configSet = new Set(configTypes);
    lines = lines.filter((l) => configSet.has(l.type));
  }

  // Time filter — for non-timestamped lines, use the nearest preceding timestamp
  if (filter.value.timeFrom || filter.value.timeTo) {
    const from = filter.value.timeFrom;
    const to = filter.value.timeTo;
    let lastSeenTime: Date | null = null;

    lines = lines.filter((l) => {
      if (l.timestampDate) {
        lastSeenTime = l.timestampDate;
      }
      const effectiveTime = l.timestampDate ?? lastSeenTime;
      if (!effectiveTime) return false; // no timestamp context yet — hide
      if (from && effectiveTime < from) return false;
      if (to && effectiveTime > to) return false;
      return true;
    });
  }

  // Entity ID filter
  if (filter.value.entityId) {
    const id = filter.value.entityId;
    lines = lines.filter((l) => l.raw.includes(id));
  }

  // Search filter
  if (searchPattern.value) {
    const re = new RegExp(searchPattern.value.source, searchPattern.value.flags);
    lines = lines.filter((l) => re.test(l.raw));
  }

  // Sort order
  if (filter.value.newestFirst) {
    lines = [...lines].reverse();
  }

  return lines;
});

function onGotoLine(lineNumber: number) {
  logViewerRef.value?.scrollToLineNumber(lineNumber);
}

function onFilter(state: FilterState) {
  // Save current line before filter changes the lines array
  const savedLine = currentLine.value ?? 1;
  filter.value = state;
  // Wait for Vue re-render AND browser layout before restoring scroll.
  // nextTick alone isn't enough — the browser needs a frame to update
  // the scroll container after the virtual list height changes.
  nextTick(() => {
    requestAnimationFrame(() => {
      logViewerRef.value?.scrollToLineNumber(savedLine);
    });
  });
}

function onApplyConfig(config: FilterConfig) {
  activeConfig.value = { ...config };
}

function onSavePreset(name: string) {
  if (!filterBarRef.value) return;
  const state = filterBarRef.value.getCurrentState();
  const preset: ViewPreset = {
    name,
    id: createPresetId(),
    search: state.search,
    isRegex: state.isRegex,
    enabledTypes: state.enabledTypes,
    timeFrom: state.timeFrom,
    timeTo: state.timeTo,
    entityId: state.entityId,
    filterConfigId: activeConfig.value?.id ?? null,
  };
  const presets = loadPresets();
  presets.push(preset);
  savePresets(presets);
}

function onLoadPreset(preset: ViewPreset) {
  // Restore filter bar state
  filterBarRef.value?.restoreFromPreset(preset);
  // Restore filter config if referenced
  if (preset.filterConfigId) {
    const configs = getAllConfigs();
    const config = configs.find((c) => c.id === preset.filterConfigId);
    if (config) {
      activeConfig.value = { ...config };
    }
  } else {
    activeConfig.value = null;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
</script>
