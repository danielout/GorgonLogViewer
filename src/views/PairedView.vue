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
 * Player.log timestamps are UTC — we add the timezone offset to get local time.
 * Chat log timestamps are already local time — no conversion needed (offset is stored on the file).
 *
 * When timezoneOffsetMs is null (player.log), we apply the offset from the
 * chat log we're syncing with. When it's set (chat log), the timestamps
 * are already local, so we use them as-is.
 */
function toLocalTimeOfDayMs(d: Date, isAlreadyLocal: boolean, offsetMs: number): number {
  const raw = d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000;
  if (isAlreadyLocal) return raw;
  // Player.log time is UTC; add offset to convert to local
  const MS_PER_DAY = 86400000;
  return ((raw + offsetMs) % MS_PER_DAY + MS_PER_DAY) % MS_PER_DAY;
}

/**
 * Resolve the timezone offset to use for conversion.
 * Chat logs have the offset stored; player.logs don't.
 * We look at whichever file has an offset to use for both.
 */
function resolveOffsetMs(): number {
  return leftFile.value?.timezoneOffsetMs ?? rightFile.value?.timezoneOffsetMs ?? 0;
}

function findClosestLineIndex(file: OpenFile, targetLocalTodMs: number, offsetMs: number): number {
  const isLocal = file.timezoneOffsetMs !== null; // chat log = local, player.log = UTC
  let closest = 0;
  let closestDiff = Infinity;
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    if (!line.timestampDate) continue;
    const lineTod = toLocalTimeOfDayMs(line.timestampDate, isLocal, offsetMs);
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
  const offsetMs = resolveOffsetMs();
  const isLocal = leftFile.value.timezoneOffsetMs !== null;
  const localTod = toLocalTimeOfDayMs(time, isLocal, offsetMs);
  const idx = findClosestLineIndex(rightFile.value, localTod, offsetMs);
  rightViewer.value.scrollToIndex(idx);
}

function onRightScroll(time: Date) {
  if (!syncScroll.value || !leftFile.value || !leftViewer.value || !rightFile.value) return;
  const offsetMs = resolveOffsetMs();
  const isLocal = rightFile.value.timezoneOffsetMs !== null;
  const localTod = toLocalTimeOfDayMs(time, isLocal, offsetMs);
  const idx = findClosestLineIndex(leftFile.value, localTod, offsetMs);
  leftViewer.value.scrollToIndex(idx);
}
</script>
