<template>
  <div class="bg-bg-secondary border-b border-border">
    <!-- Row 1: Search, entity, time, actions -->
    <div class="flex items-center gap-2 px-4 py-2">
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

    <!-- Row 2: Type category pills -->
    <div v-if="groupedTypes.length > 0" class="flex items-center gap-1 px-4 py-1.5 border-t border-border/50 flex-wrap">
      <!-- All toggle -->
      <button
        class="text-xs px-2 py-0.5 rounded border transition-colors"
        :class="allEnabled
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-border bg-bg-surface text-text-muted hover:text-text-secondary'"
        @click="toggleAll"
      >
        All
      </button>

      <span class="w-px h-4 bg-border/50 mx-0.5"></span>

      <!-- Category pills -->
      <div v-for="group in groupedTypes" :key="group.label" class="relative" :ref="el => setCategoryRef(group.label, el as HTMLElement)">
        <div class="flex items-center">
          <!-- Category toggle button -->
          <button
            class="text-xs pl-2 pr-1 py-0.5 rounded-l border transition-colors"
            :class="isGroupFullyEnabled(group)
              ? 'border-accent/50 bg-accent/10 text-accent'
              : isGroupPartiallyEnabled(group)
                ? 'border-accent/30 bg-accent/5 text-accent/70'
                : 'border-border bg-bg-surface text-text-muted hover:text-text-secondary'"
            @click="toggleGroup(group)"
          >
            {{ group.label }}
            <span v-if="isGroupPartiallyEnabled(group)" class="text-accent/50 ml-0.5">
              {{ group.types.filter(t => enabledTypes.has(t)).length }}/{{ group.types.length }}
            </span>
          </button>
          <!-- Dropdown arrow -->
          <button
            class="text-xs px-1 py-0.5 rounded-r border border-l-0 transition-colors"
            :class="openDropdown === group.label
              ? 'border-accent/50 bg-accent/20 text-accent'
              : isGroupFullyEnabled(group)
                ? 'border-accent/50 bg-accent/10 text-accent'
                : isGroupPartiallyEnabled(group)
                  ? 'border-accent/30 bg-accent/5 text-accent/70'
                  : 'border-border bg-bg-surface text-text-muted hover:text-text-secondary'"
            @click.stop="openDropdown = openDropdown === group.label ? null : group.label"
          >
            ▾
          </button>
        </div>

        <!-- Individual type dropdown -->
        <div
          v-if="openDropdown === group.label"
          class="absolute left-0 top-full mt-1 bg-bg-surface border border-border rounded shadow-lg z-20 p-1 min-w-40"
        >
          <label
            v-for="lt in group.types"
            :key="lt"
            class="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-bg-hover rounded"
          >
            <input
              type="checkbox"
              :checked="enabledTypes.has(lt)"
              @change="toggleType(lt)"
              class="accent-accent"
            />
            <span :class="typeColorClass(lt)">{{ typeLabel(lt) }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { LogLineType, FilterState, ViewPreset } from "../lib/types";
import { typeColorClass, typeLabel } from "../lib/log-colors";
import { generatedFilterCategories } from "../lib/generated/reference-entries";
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
const enabledTypes = ref(new Set<LogLineType>());
const openDropdown = ref<string | null>(null);
const categoryRefs = new Map<string, HTMLElement>();

function setCategoryRef(label: string, el: HTMLElement | null) {
  if (el) categoryRefs.set(label, el);
  else categoryRefs.delete(label);
}

// Initialize enabled types to all available types
watch(() => props.availableTypes, (types) => {
  enabledTypes.value = new Set(types);
}, { immediate: true });

const allEnabled = computed(() =>
  props.availableTypes.length > 0 && props.availableTypes.every((t) => enabledTypes.value.has(t))
);

interface TypeGroup {
  label: string;
  types: LogLineType[];
}

const groupedTypes = computed<TypeGroup[]>(() => {
  const available = new Set(props.availableTypes);
  const groups: TypeGroup[] = [];
  const used = new Set<LogLineType>();

  for (const category of generatedFilterCategories) {
    const types = category.types.filter((t) => available.has(t));
    if (types.length > 0) {
      groups.push({ label: category.label, types });
      types.forEach((t) => used.add(t));
    }
  }

  // Catch any types not covered by a generated category
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

function toggleAll() {
  const s = new Set(enabledTypes.value);
  if (allEnabled.value) {
    s.clear();
  } else {
    props.availableTypes.forEach((t) => s.add(t));
  }
  enabledTypes.value = s;
  emitFilter();
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

function toggleType(type: LogLineType) {
  const s = new Set(enabledTypes.value);
  if (s.has(type)) s.delete(type);
  else s.add(type);
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
  if (openDropdown.value) {
    const activeRef = categoryRefs.get(openDropdown.value);
    if (activeRef && !activeRef.contains(e.target as Node)) {
      openDropdown.value = null;
    }
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>
