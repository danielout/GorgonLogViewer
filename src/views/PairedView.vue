<template>
  <div class="flex flex-col h-full">
    <!-- File selectors -->
    <div class="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-b border-border">
      <div class="flex items-center gap-2">
        <span class="text-xs text-text-muted">Left:</span>
        <select
          v-model="leftPath"
          class="bg-bg-surface text-text-primary text-sm px-2 py-1 rounded border border-border focus:border-accent focus:outline-none"
        >
          <option value="">Select file...</option>
          <option v-for="f in logFiles" :key="f.path" :value="f.path">{{ f.name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-text-muted">Right:</span>
        <select
          v-model="rightPath"
          class="bg-bg-surface text-text-primary text-sm px-2 py-1 rounded border border-border focus:border-accent focus:outline-none"
        >
          <option value="">Select file...</option>
          <option v-for="f in logFiles" :key="f.path" :value="f.path">{{ f.name }}</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 text-sm text-text-secondary ml-auto">
        <input type="checkbox" v-model="syncScroll" class="accent-accent" />
        Sync scroll
      </label>
    </div>

    <!-- Side-by-side viewers -->
    <div class="flex flex-1 min-h-0">
      <div class="flex-1 flex flex-col border-r border-border min-w-0">
        <LogViewer
          v-if="leftFile"
          ref="leftViewer"
          :lines="leftFile.lines"
          :search-pattern="null"
          @scroll-to-time="onLeftScroll"
        />
        <div v-else class="flex-1 flex items-center justify-center text-text-muted text-sm">
          Select a file for the left panel
        </div>
      </div>
      <div class="flex-1 flex flex-col min-w-0">
        <LogViewer
          v-if="rightFile"
          ref="rightViewer"
          :lines="rightFile.lines"
          :search-pattern="null"
          @scroll-to-time="onRightScroll"
        />
        <div v-else class="flex-1 flex items-center justify-center text-text-muted text-sm">
          Select a file for the right panel
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { OpenFile } from "../lib/types";
import LogViewer from "../components/LogViewer.vue";

const props = defineProps<{
  openFiles: OpenFile[];
}>();

const leftPath = ref("");
const rightPath = ref("");
const syncScroll = ref(true);

const logFiles = computed(() => props.openFiles.filter((f) => f.kind !== "json"));
const leftFile = computed(() => props.openFiles.find((f) => f.path === leftPath.value) ?? null);
const rightFile = computed(() => props.openFiles.find((f) => f.path === rightPath.value) ?? null);

const leftViewer = ref<InstanceType<typeof LogViewer> | null>(null);
const rightViewer = ref<InstanceType<typeof LogViewer> | null>(null);

/**
 * Get time-of-day in ms, normalized to local time.
 *
 * Chat log timestamps are stored as UTC but parsed as if local.
 * To get the actual local time, we add the timezone offset.
 * Player.log timestamps are already local, so offset is null/0.
 */
function toLocalTimeOfDayMs(d: Date, timezoneOffsetMs: number | null): number {
  const raw = d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000;
  if (timezoneOffsetMs === null) return raw;
  // Chat log time is UTC; add offset to get local time
  // Wrap around midnight (mod 24h)
  const MS_PER_DAY = 86400000;
  return ((raw + timezoneOffsetMs) % MS_PER_DAY + MS_PER_DAY) % MS_PER_DAY;
}

function findClosestLineIndex(file: OpenFile, targetLocalTodMs: number): number {
  const offset = file.timezoneOffsetMs;
  let closest = 0;
  let closestDiff = Infinity;
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    if (!line.timestampDate) continue;
    const lineTod = toLocalTimeOfDayMs(line.timestampDate, offset);
    const diff = Math.abs(lineTod - targetLocalTodMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = i;
    }
  }
  return closest;
}

function onLeftScroll(time: Date) {
  if (!syncScroll.value || !rightFile.value || !rightViewer.value || !leftFile.value) return;
  // Convert the scrolled time to local time-of-day using the source file's offset
  const localTod = toLocalTimeOfDayMs(time, leftFile.value.timezoneOffsetMs);
  const idx = findClosestLineIndex(rightFile.value, localTod);
  rightViewer.value.scrollToIndex(idx);
}

function onRightScroll(time: Date) {
  if (!syncScroll.value || !leftFile.value || !leftViewer.value || !rightFile.value) return;
  const localTod = toLocalTimeOfDayMs(time, rightFile.value.timezoneOffsetMs);
  const idx = findClosestLineIndex(leftFile.value, localTod);
  leftViewer.value.scrollToIndex(idx);
}
</script>
