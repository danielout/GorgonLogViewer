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
        @filter="onFilter"
        @toggle-tailing="$emit('toggleTailing', activeFileData!.path)"
        @toggle-config="showConfigPanel = !showConfigPanel"
        @save-preset="onSavePreset"
        @load-preset="onLoadPreset"
      />
      <div class="flex flex-1 min-h-0">
        <LogViewer
          class="flex-1"
          :lines="filteredLines"
          :search-pattern="searchPattern"
          :highlight-rules="activeHighlightRules"
          :auto-scroll="activeFileData.tailing"
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
import { ref, computed } from "vue";
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

defineEmits<{
  toggleTailing: [path: string];
}>();

const jsonViewMode = ref<"tree" | "schema">("tree");
const showConfigPanel = ref(false);
const activeConfig = ref<FilterConfig | null>(null);
const filterBarRef = ref<InstanceType<typeof FilterBar> | null>(null);

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

  // Config type restriction (intersect with filter bar types)
  const configTypes = activeConfig.value?.enabledTypes;
  const filterTypes = filter.value.enabledTypes;

  if (configTypes && configTypes.length > 0 && filterTypes.size > 0) {
    const configSet = new Set(configTypes);
    lines = lines.filter((l) => configSet.has(l.type) && filterTypes.has(l.type));
  } else if (configTypes && configTypes.length > 0) {
    const configSet = new Set(configTypes);
    lines = lines.filter((l) => configSet.has(l.type));
  } else if (filterTypes.size > 0) {
    lines = lines.filter((l) => filterTypes.has(l.type));
  }

  // Time filter
  if (filter.value.timeFrom) {
    const from = filter.value.timeFrom;
    lines = lines.filter((l) => !l.timestampDate || l.timestampDate >= from);
  }
  if (filter.value.timeTo) {
    const to = filter.value.timeTo;
    lines = lines.filter((l) => !l.timestampDate || l.timestampDate <= to);
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

  return lines;
});

function onFilter(state: FilterState) {
  filter.value = state;
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
