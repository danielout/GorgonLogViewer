<template>
  <div
    ref="containerRef"
    class="flex-1 overflow-y-auto font-mono text-sm leading-6"
    @scroll="onScroll"
  >
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="line in visibleLines"
          :key="line.lineNumber"
          class="flex hover:bg-bg-hover/50 px-4 group"
          :class="typeColorClass(line.type)"
          :style="getHighlightStyle(line)"
          @mouseenter="showTooltip($event, line)"
          @mouseleave="hideTooltip"
        >
          <span class="w-14 shrink-0 text-right pr-3 text-text-muted select-none">{{ line.lineNumber }}</span>
          <span class="w-36 shrink-0 pr-3 text-log-timestamp select-none">{{ formatTimestamp(line) }}</span>
          <span class="whitespace-pre-wrap break-all min-w-0" v-html="highlightSearch(line.content, line)"></span>
        </div>
      </div>
    </div>
    <LineTooltip :info="tooltipInfo" :x="tooltipX" :y="tooltipY" @open-reference="$emit('openReference', $event)" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { LogLine, HighlightRule } from "../lib/types";
import { typeColorClass } from "../lib/log-colors";
import { findScrollIndex } from "../lib/scroll-utils";
import { getEventInfo, type EventInfo } from "../lib/event-reference";
import LineTooltip from "./LineTooltip.vue";

const props = defineProps<{
  lines: LogLine[];
  searchPattern: RegExp | null;
  highlightRules?: HighlightRule[];
  autoScroll?: boolean;
  /** "utc" shows raw timestamps, "local" converts UTC dates to local time */
  timeDisplay?: "utc" | "local";
  /** Timezone offset in ms (from chat log header) for local conversion */
  timezoneOffsetMs?: number | null;
}>();

const LINE_HEIGHT = 24;

function formatTimestamp(line: LogLine): string {
  if (!line.timestamp) return "";
  if (props.timeDisplay !== "local" || !line.timestampDate) return line.timestamp;
  // Convert UTC date to local display using the offset
  const offsetMs = props.timezoneOffsetMs ?? 0;
  const localDate = new Date(line.timestampDate.getTime() + offsetMs);
  const hh = String(localDate.getUTCHours()).padStart(2, "0");
  const mm = String(localDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(localDate.getUTCSeconds()).padStart(2, "0");
  // If the raw timestamp had a date prefix (chat log), include it
  if (line.timestamp.includes("-")) {
    const yy = String(localDate.getUTCFullYear() % 100).padStart(2, "0");
    const mo = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getUTCDate()).padStart(2, "0");
    return `${yy}-${mo}-${dd} ${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}:${ss}`;
}
const OVERSCAN = 20;

const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(600);

const totalHeight = computed(() => props.lines.length * LINE_HEIGHT);
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / LINE_HEIGHT) - OVERSCAN));
const endIndex = computed(() =>
  Math.min(props.lines.length, Math.ceil((scrollTop.value + viewportHeight.value) / LINE_HEIGHT) + OVERSCAN)
);
const offsetY = computed(() => startIndex.value * LINE_HEIGHT);
const visibleLines = computed(() => props.lines.slice(startIndex.value, endIndex.value));

const tooltipInfo = ref<EventInfo | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

function showTooltip(event: MouseEvent, line: LogLine) {
  const info = getEventInfo(line.content, line.type);
  if (!info) {
    tooltipInfo.value = null;
    return;
  }
  tooltipInfo.value = info;
  // Position tooltip above the cursor so it doesn't cover the line
  const rect = containerRef.value?.getBoundingClientRect();
  if (rect) {
    tooltipX.value = event.clientX - rect.left + 12;
    // Place above the mouse; the LineTooltip uses `bottom` positioning
    tooltipY.value = rect.bottom - event.clientY + 8;
  }
}

function hideTooltip() {
  tooltipInfo.value = null;
}

const emit = defineEmits<{
  scrollToTime: [time: Date];
  openReference: [name: string];
  positionChange: [lineNumber: number | null, timestamp: string | null];
}>();

let suppressEmit = false;

function onScroll() {
  if (!containerRef.value) return;
  scrollTop.value = containerRef.value.scrollTop;

  // Emit the timestamp of the center visible line for paired sync
  if (!suppressEmit) {
    const centerIdx = Math.floor((scrollTop.value + viewportHeight.value / 2) / LINE_HEIGHT);
    const centerLine = props.lines[Math.min(centerIdx, props.lines.length - 1)];
    if (centerLine?.timestampDate) {
      emit("scrollToTime", centerLine.timestampDate);
    }
  }
}

function scrollToIndex(index: number) {
  if (!containerRef.value) return;
  suppressEmit = true;
  containerRef.value.scrollTop = index * LINE_HEIGHT;
  scrollTop.value = containerRef.value.scrollTop;
  // Re-enable emit after the scroll settles
  requestAnimationFrame(() => { suppressEmit = false; });
}



function updateViewportHeight() {
  if (containerRef.value) {
    viewportHeight.value = containerRef.value.clientHeight;
  }
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateViewportHeight();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

// Auto-scroll to bottom when tailing
watch(() => props.lines.length, () => {
  if (props.autoScroll && containerRef.value) {
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
        scrollTop.value = containerRef.value.scrollTop;
      }
    });
  }
});

// Emit position info on scroll
const visibleStartIndex = computed(() => Math.floor(scrollTop.value / LINE_HEIGHT));
watch(visibleStartIndex, () => {
  if (props.lines.length > 0 && visibleStartIndex.value < props.lines.length) {
    const line = props.lines[visibleStartIndex.value];
    // Find the nearest timestamp (current line or scan backwards)
    let ts: string | null = null;
    if (line?.timestamp) {
      ts = line.timestamp;
    } else {
      for (let i = visibleStartIndex.value - 1; i >= 0; i--) {
        if (props.lines[i]?.timestamp) {
          ts = props.lines[i].timestamp;
          break;
        }
      }
    }
    emit("positionChange", line?.lineNumber ?? null, ts);
  }
});

/** Scroll to the nearest line with the given original line number */
function scrollToLineNumber(targetLineNumber: number) {
  if (!containerRef.value || props.lines.length === 0) return;
  const idx = findScrollIndex(props.lines, targetLineNumber);
  containerRef.value.scrollTop = idx * LINE_HEIGHT;
  scrollTop.value = containerRef.value.scrollTop;
}

defineExpose({ scrollToIndex, scrollToLineNumber });

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syntaxHighlight(text: string): string {
  // Apply syntax coloring to arguments in Process* event lines
  // Order matters — strings first (so numbers inside strings don't get double-wrapped)
  let result = text;

  // Quoted strings: "..."
  result = result.replace(/&quot;([^&]*?)&quot;|"([^"]*?)"/g, (m) =>
    `<span class="text-syn-string">${m}</span>`
  );

  // Booleans: True/False
  result = result.replace(/\b(True|False)\b/g,
    `<span class="text-syn-bool">$1</span>`
  );

  // Numbers: integers and floats (including negative)
  result = result.replace(/(?<![A-Za-z_\-"])(-?\b\d+\.?\d*)\b(?![A-Za-z_"])/g,
    `<span class="text-syn-number">$1</span>`
  );

  // Event/method names: Process* and other PascalCase identifiers before (
  result = result.replace(/\b(Process\w+|LocalPlayer)\b/g,
    `<span class="text-syn-keyword">$1</span>`
  );

  // Parentheses and brackets
  result = result.replace(/([()[\]{}])/g,
    `<span class="text-syn-paren">$1</span>`
  );

  return result;
}

function highlightSearch(content: string, line: LogLine): string {
  const escaped = escapeHtml(content);

  // Apply syntax highlighting for .log files (not chat logs)
  const isChatLine = line.type.startsWith("chat-");
  const highlighted = isChatLine ? escaped : syntaxHighlight(escaped);

  if (!props.searchPattern) return highlighted;

  try {
    return highlighted.replace(props.searchPattern, (match) =>
      `<mark class="bg-accent/30 text-inherit rounded px-0.5">${match}</mark>`
    );
  } catch {
    return highlighted;
  }
}

function getHighlightStyle(line: LogLine): Record<string, string> {
  if (!props.highlightRules?.length) return {};
  for (const rule of props.highlightRules) {
    try {
      const re = rule.isRegex
        ? new RegExp(rule.pattern, "i")
        : new RegExp(escapeRegex(rule.pattern), "i");
      if (re.test(line.raw)) {
        return { color: rule.color };
      }
    } catch {
      // invalid regex, skip
    }
  }
  return {};
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
</script>
