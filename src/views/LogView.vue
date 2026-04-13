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
        :total-count="activeFileData.lines.length"
        :filtered-count="filteredLines.length"
        :tailing="activeFileData.tailing"
        @filter="onFilter"
        @toggle-tailing="$emit('toggleTailing', activeFileData!.path)"
      />
      <LogViewer
        :lines="filteredLines"
        :search-pattern="searchPattern"
        :auto-scroll="activeFileData.tailing"
      />
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
import type { OpenFile, FilterState, LogLine } from "../lib/types";
import { analyzeCdnSchema } from "../lib/cdn-schema";
import FilterBar from "../components/FilterBar.vue";
import LogViewer from "../components/LogViewer.vue";
import JsonViewer from "../components/JsonViewer.vue";
import CdnSchemaView from "../components/CdnSchemaView.vue";

const props = defineProps<{
  activeFile: string | null;
  openFiles: OpenFile[];
}>();

defineEmits<{
  toggleTailing: [path: string];
}>();

const jsonViewMode = ref<"tree" | "schema">("tree");

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

  // Type filter
  if (filter.value.enabledTypes.size > 0) {
    lines = lines.filter((l) => filter.value.enabledTypes.has(l.type));
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
</script>
