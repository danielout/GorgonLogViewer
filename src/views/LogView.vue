<template>
  <div v-if="activeFileData" class="flex flex-col h-full">
    <template v-if="activeFileData.kind === 'json'">
      <JsonViewer :content="activeFileData.rawContent" />
    </template>
    <template v-else>
      <FilterBar
        :total-count="activeFileData.lines.length"
        :filtered-count="filteredLines.length"
        @filter="onFilter"
      />
      <LogViewer
        :lines="filteredLines"
        :search-pattern="searchPattern"
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
import FilterBar from "../components/FilterBar.vue";
import LogViewer from "../components/LogViewer.vue";
import JsonViewer from "../components/JsonViewer.vue";

const props = defineProps<{
  activeFile: string | null;
  openFiles: OpenFile[];
}>();

const filter = ref<FilterState>({
  search: "",
  isRegex: false,
  enabledTypes: new Set(),
  timeFrom: null,
  timeTo: null,
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
