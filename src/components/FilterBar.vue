<template>
  <div class="flex items-center gap-2 px-4 py-2 bg-bg-secondary border-b border-border">
    <!-- Search -->
    <div class="relative flex-1 max-w-md">
      <input
        v-model="searchText"
        type="text"
        :placeholder="isRegex ? 'Regex pattern...' : 'Search...'"
        class="w-full bg-bg-surface text-text-primary text-sm px-3 py-1.5 rounded border border-border focus:border-accent focus:outline-none placeholder:text-text-muted"
        @input="emitFilter"
      />
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded font-mono"
        :class="isRegex ? 'bg-accent text-bg-primary' : 'text-text-muted hover:text-text-primary'"
        title="Toggle regex"
        @click="isRegex = !isRegex; emitFilter()"
      >
        .*
      </button>
    </div>

    <!-- Type filter dropdown -->
    <div class="relative" ref="dropdownRef">
      <button
        class="text-sm px-3 py-1.5 rounded border border-border bg-bg-surface text-text-secondary hover:text-text-primary transition-colors"
        @click="showTypeFilter = !showTypeFilter"
      >
        Types
        <span v-if="disabledCount > 0" class="ml-1 text-xs text-accent">({{ enabledCount }})</span>
      </button>

      <div
        v-if="showTypeFilter"
        class="absolute right-0 top-full mt-1 bg-bg-surface border border-border rounded shadow-lg z-10 p-2 min-w-52 max-h-80 overflow-y-auto"
      >
        <template v-for="group in groupedTypes" :key="group.label">
          <div class="flex items-center gap-2 px-2 py-1 text-xs text-text-muted cursor-pointer hover:text-text-secondary" @click="toggleGroup(group)">
            <input
              type="checkbox"
              :checked="isGroupFullyEnabled(group)"
              :indeterminate="isGroupPartiallyEnabled(group)"
              class="accent-accent"
              @click.stop="toggleGroup(group)"
            />
            <span class="font-semibold uppercase tracking-wider">{{ group.label }}</span>
          </div>
          <label
            v-for="lt in group.types"
            :key="lt"
            class="flex items-center gap-2 px-2 py-1 pl-6 text-sm cursor-pointer hover:bg-bg-hover rounded"
          >
            <input
              type="checkbox"
              :checked="enabledTypes.has(lt)"
              @change="toggleType(lt)"
              class="accent-accent"
            />
            <span :class="typeColorClass(lt)">{{ typeLabel(lt) }}</span>
          </label>
        </template>
      </div>
    </div>

    <!-- Entity ID -->
    <input
      v-model="entityId"
      type="text"
      placeholder="Entity ID"
      class="w-28 bg-bg-surface text-text-primary text-sm px-2 py-1.5 rounded border border-border focus:border-accent focus:outline-none placeholder:text-text-muted font-mono"
      title="Filter lines containing this entity ID"
      @input="emitFilter"
    />

    <!-- Timestamp range -->
    <input
      v-model="timeFrom"
      type="text"
      placeholder="From HH:MM:SS"
      class="w-28 bg-bg-surface text-text-primary text-sm px-2 py-1.5 rounded border border-border focus:border-accent focus:outline-none placeholder:text-text-muted"
      @input="emitFilter"
    />
    <input
      v-model="timeTo"
      type="text"
      placeholder="To HH:MM:SS"
      class="w-28 bg-bg-surface text-text-primary text-sm px-2 py-1.5 rounded border border-border focus:border-accent focus:outline-none placeholder:text-text-muted"
      @input="emitFilter"
    />

    <!-- Tail toggle -->
    <button
      class="text-sm px-3 py-1.5 rounded border transition-colors"
      :class="tailing
        ? 'border-log-chat-global bg-log-chat-global/15 text-log-chat-global'
        : 'border-border bg-bg-surface text-text-secondary hover:text-text-primary'"
      title="Toggle live tailing"
      @click="$emit('toggleTailing')"
    >
      {{ tailing ? 'Tailing' : 'Tail' }}
    </button>

    <!-- Config panel toggle -->
    <button
      class="text-sm px-3 py-1.5 rounded border border-border bg-bg-surface text-text-secondary hover:text-text-primary transition-colors"
      title="Filter configurations"
      @click="$emit('toggleConfig')"
    >
      Config
    </button>

    <!-- View presets -->
    <PresetMenu
      @save="(name: string) => $emit('savePreset', name)"
      @load="(preset: ViewPreset) => $emit('loadPreset', preset)"
    />

    <!-- Line count -->
    <span class="text-xs text-text-muted ml-auto whitespace-nowrap">
      {{ filteredCount }} / {{ totalCount }} lines
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { LogLineType, FilterState, ViewPreset } from "../lib/types";
import { typeColorClass, typeLabel } from "../lib/log-colors";
import PresetMenu from "./PresetMenu.vue";

const props = defineProps<{
  totalCount: number;
  filteredCount: number;
  tailing: boolean;
  availableTypes: LogLineType[];
}>();

const emit = defineEmits<{
  filter: [state: FilterState];
  toggleTailing: [];
  toggleConfig: [];
  savePreset: [name: string];
  loadPreset: [preset: ViewPreset];
}>();

const searchText = ref("");
const isRegex = ref(false);
const entityId = ref("");
const timeFrom = ref("");
const timeTo = ref("");
const showTypeFilter = ref(false);
const enabledTypes = ref(new Set<LogLineType>());
const dropdownRef = ref<HTMLElement | null>(null);

// Initialize enabled types to all available types
watch(() => props.availableTypes, (types) => {
  enabledTypes.value = new Set(types);
}, { immediate: true });

const enabledCount = computed(() => enabledTypes.value.size);
const disabledCount = computed(() => props.availableTypes.length - enabledTypes.value.size);

interface TypeGroup {
  label: string;
  types: LogLineType[];
}

const TYPE_GROUP_ORDER: [string, LogLineType[]][] = [
  ["Chat", ["chat-global", "chat-help", "chat-nearby", "chat-guild", "chat-trade", "chat-party", "chat-tell", "chat-emote", "chat-announcement", "chat-info", "chat-error", "chat-custom"]],
  ["Combat", ["combat", "effect", "attribute"]],
  ["Items", ["item", "vendor"]],
  ["Skills", ["skill"]],
  ["Quests", ["quest"]],
  ["Social", ["interaction", "npc", "action"]],
  ["World", ["status", "mount", "weather", "system", "unknown"]],
];

const groupedTypes = computed<TypeGroup[]>(() => {
  const available = new Set(props.availableTypes);
  const groups: TypeGroup[] = [];
  const used = new Set<LogLineType>();

  for (const [label, candidates] of TYPE_GROUP_ORDER) {
    const types = candidates.filter((t) => available.has(t));
    if (types.length > 0) {
      groups.push({ label, types });
      types.forEach((t) => used.add(t));
    }
  }

  // Catch any types not in a defined group
  const ungrouped = props.availableTypes.filter((t) => !used.has(t));
  if (ungrouped.length > 0) {
    groups.push({ label: "Other", types: ungrouped });
  }

  return groups;
});

function isGroupFullyEnabled(group: TypeGroup): boolean {
  return group.types.every((t) => enabledTypes.value.has(t));
}

function isGroupPartiallyEnabled(group: TypeGroup): boolean {
  const count = group.types.filter((t) => enabledTypes.value.has(t)).length;
  return count > 0 && count < group.types.length;
}

function toggleGroup(group: TypeGroup) {
  const s = new Set(enabledTypes.value);
  if (isGroupFullyEnabled(group)) {
    group.types.forEach((t) => s.delete(t));
  } else {
    group.types.forEach((t) => s.add(t));
  }
  enabledTypes.value = s;
  emitFilter();
}

/** Get current state for saving as a preset */
function getCurrentState() {
  return {
    search: searchText.value,
    isRegex: isRegex.value,
    enabledTypes: [...enabledTypes.value],
    timeFrom: timeFrom.value,
    timeTo: timeTo.value,
    entityId: entityId.value,
  };
}

/** Restore state from a preset */
function restoreFromPreset(preset: ViewPreset) {
  searchText.value = preset.search;
  isRegex.value = preset.isRegex;
  entityId.value = preset.entityId;
  timeFrom.value = preset.timeFrom;
  timeTo.value = preset.timeTo;
  if (preset.enabledTypes.length > 0) {
    enabledTypes.value = new Set(preset.enabledTypes as LogLineType[]);
  } else {
    enabledTypes.value = new Set(props.availableTypes);
  }
  emitFilter();
}

defineExpose({ getCurrentState, restoreFromPreset });

function toggleType(type: LogLineType) {
  const s = new Set(enabledTypes.value);
  if (s.has(type)) s.delete(type);
  else s.add(type);
  enabledTypes.value = s;
  emitFilter();
}

function parseTimeInput(val: string): Date | null {
  const m = val.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const d = new Date();
  d.setHours(parseInt(m[1]), parseInt(m[2]), parseInt(m[3] ?? "0"), 0);
  return d;
}

function emitFilter() {
  emit("filter", {
    search: searchText.value,
    isRegex: isRegex.value,
    enabledTypes: new Set(enabledTypes.value),
    timeFrom: parseTimeInput(timeFrom.value),
    timeTo: parseTimeInput(timeTo.value),
    entityId: entityId.value.trim(),
  });
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showTypeFilter.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>
