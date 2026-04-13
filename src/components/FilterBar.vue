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

      <!-- Sort order toggle -->
      <button
        class="text-sm px-3 py-1.5 rounded border border-border bg-bg-surface text-text-secondary hover:text-text-primary transition-colors"
        title="Toggle sort order"
        @click="newestFirst = !newestFirst; emitFilter()"
      >
        {{ newestFirst ? '↑ Newest' : '↓ Oldest' }}
      </button>

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

    <!-- Row 2: Event category pills with event-level dropdowns -->
    <div v-if="eventGroups.length > 0" class="flex items-center gap-1 px-4 py-1.5 border-t border-border/50 flex-wrap">
      <!-- All toggle -->
      <button
        class="text-xs px-2 py-0.5 rounded border transition-colors"
        :class="disabledEvents.size === 0
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-border bg-bg-surface text-text-muted hover:text-text-secondary'"
        @click="toggleAll"
      >
        All
      </button>

      <span class="w-px h-4 bg-border/50 mx-0.5"></span>

      <!-- Category pills -->
      <div v-for="group in eventGroups" :key="group.label" class="relative" :ref="el => setCategoryRef(group.label, el as HTMLElement)">
        <div class="flex items-center">
          <!-- Category toggle button -->
          <button
            class="text-xs pl-2 pr-1 py-0.5 rounded-l border transition-colors"
            :class="categoryClass(group)"
            @click="toggleCategory(group)"
          >
            {{ group.label }}
            <span v-if="categoryDisabledCount(group) > 0 && categoryDisabledCount(group) < group.events.length" class="text-accent/50 ml-0.5">
              {{ group.events.length - categoryDisabledCount(group) }}/{{ group.events.length }}
            </span>
          </button>
          <!-- Dropdown arrow -->
          <button
            class="text-xs px-1 py-0.5 rounded-r border border-l-0 transition-colors"
            :class="openDropdown === group.label
              ? 'border-accent/50 bg-accent/20 text-accent'
              : categoryClass(group)"
            @click.stop="openDropdown = openDropdown === group.label ? null : group.label"
          >
            ▾
          </button>
        </div>

        <!-- Individual event dropdown -->
        <div
          v-if="openDropdown === group.label"
          class="absolute left-0 top-full mt-1 bg-bg-surface border border-border rounded shadow-lg z-20 p-1 min-w-48 max-h-64 overflow-y-auto"
        >
          <label
            v-for="evt in group.events"
            :key="evt"
            class="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-bg-hover rounded font-mono"
          >
            <input
              type="checkbox"
              :checked="!disabledEvents.has(evt)"
              @change="toggleEvent(evt)"
              class="accent-accent"
            />
            <span :class="disabledEvents.has(evt) ? 'text-text-muted' : 'text-text-primary'">{{ evt }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { LogLineType, FilterState, ViewPreset } from "../lib/types";
import { generatedFilterCategories } from "../lib/generated/reference-entries";
import PresetMenu from "./PresetMenu.vue";

const props = defineProps<{
  totalCount: number;
  filteredCount: number;
  tailing: boolean;
  availableTypes: LogLineType[];
  /** All event names found in the current file, grouped by their LogLineType */
  availableEvents: Map<LogLineType, Set<string>>;
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
const newestFirst = ref(false);
const disabledEvents = ref(new Set<string>());
const enabledTypes = ref(new Set<LogLineType>());
const openDropdown = ref<string | null>(null);
const categoryRefs = new Map<string, HTMLElement>();

function setCategoryRef(label: string, el: HTMLElement | null) {
  if (el) categoryRefs.set(label, el);
  else categoryRefs.delete(label);
}

// Reset disabled events when file changes
watch(() => props.availableTypes, () => {
  disabledEvents.value = new Set();
  enabledTypes.value = new Set(props.availableTypes);
}, { immediate: true });

interface EventGroup {
  label: string;
  categoryTypes: LogLineType[];
  events: string[];
}

const eventGroups = computed<EventGroup[]>(() => {
  const available = new Set(props.availableTypes);
  const groups: EventGroup[] = [];
  const usedTypes = new Set<LogLineType>();

  for (const category of generatedFilterCategories) {
    const types = category.types.filter((t) => available.has(t));
    if (types.length === 0) continue;

    // Collect all event names for these types
    const events = new Set<string>();
    for (const t of types) {
      const typeEvents = props.availableEvents.get(t);
      if (typeEvents) {
        for (const e of typeEvents) events.add(e);
      }
    }

    if (events.size > 0) {
      groups.push({
        label: category.label,
        categoryTypes: types,
        events: [...events].sort(),
      });
      types.forEach((t) => usedTypes.add(t));
    }
  }

  // Catch ungrouped
  const ungroupedEvents = new Set<string>();
  const ungroupedTypes: LogLineType[] = [];
  for (const t of props.availableTypes) {
    if (usedTypes.has(t)) continue;
    ungroupedTypes.push(t);
    const typeEvents = props.availableEvents.get(t);
    if (typeEvents) {
      for (const e of typeEvents) ungroupedEvents.add(e);
    }
  }
  if (ungroupedEvents.size > 0) {
    groups.push({ label: "Other", categoryTypes: ungroupedTypes, events: [...ungroupedEvents].sort() });
  }

  return groups;
});

function categoryDisabledCount(group: EventGroup): number {
  return group.events.filter((e) => disabledEvents.value.has(e)).length;
}

function categoryClass(group: EventGroup): string {
  const disabled = categoryDisabledCount(group);
  if (disabled === 0) return "border-accent/50 bg-accent/10 text-accent";
  if (disabled === group.events.length) return "border-border bg-bg-surface text-text-muted hover:text-text-secondary";
  return "border-accent/30 bg-accent/5 text-accent/70";
}

function toggleAll() {
  if (disabledEvents.value.size === 0) {
    // Disable all
    const all = new Set<string>();
    for (const g of eventGroups.value) {
      for (const e of g.events) all.add(e);
    }
    disabledEvents.value = all;
  } else {
    disabledEvents.value = new Set();
  }
  syncEnabledTypes();
  emitFilter();
}

function toggleCategory(group: EventGroup) {
  const s = new Set(disabledEvents.value);
  const allDisabled = categoryDisabledCount(group) === group.events.length;
  if (allDisabled) {
    // Enable all in this category
    for (const e of group.events) s.delete(e);
  } else {
    // Disable all in this category
    for (const e of group.events) s.add(e);
  }
  disabledEvents.value = s;
  syncEnabledTypes();
  emitFilter();
}

function toggleEvent(eventName: string) {
  const s = new Set(disabledEvents.value);
  if (s.has(eventName)) s.delete(eventName);
  else s.add(eventName);
  disabledEvents.value = s;
  syncEnabledTypes();
  emitFilter();
}

/** Keep enabledTypes in sync — a type is enabled if any of its events are enabled */
function syncEnabledTypes() {
  const types = new Set<LogLineType>();
  for (const [type, events] of props.availableEvents) {
    for (const e of events) {
      if (!disabledEvents.value.has(e)) {
        types.add(type);
        break;
      }
    }
  }
  enabledTypes.value = types;
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
  disabledEvents.value = new Set();
  enabledTypes.value = new Set(props.availableTypes);
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
    disabledEvents: new Set(disabledEvents.value),
    newestFirst: newestFirst.value,
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
