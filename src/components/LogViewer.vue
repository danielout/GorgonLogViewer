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
          <span v-if="line.timestamp" class="shrink-0 pr-3 text-log-timestamp select-none">{{ line.timestamp }}</span>
          <span class="whitespace-pre-wrap break-all min-w-0" v-html="highlightSearch(line.content)"></span>
        </div>
      </div>
    </div>
    <LineTooltip :info="tooltipInfo" :x="tooltipX" :y="tooltipY" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { LogLine, HighlightRule } from "../lib/types";
import { typeColorClass } from "../lib/log-colors";
import { getEventInfo, type EventInfo } from "../lib/event-reference";
import LineTooltip from "./LineTooltip.vue";

const props = defineProps<{
  lines: LogLine[];
  searchPattern: RegExp | null;
  highlightRules?: HighlightRule[];
  autoScroll?: boolean;
}>();

const LINE_HEIGHT = 24;
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
  // Position relative to the container
  const rect = containerRef.value?.getBoundingClientRect();
  if (rect) {
    tooltipX.value = event.clientX - rect.left + 12;
    tooltipY.value = event.clientY - rect.top + 12;
  }
}

function hideTooltip() {
  tooltipInfo.value = null;
}

const emit = defineEmits<{
  scrollToTime: [time: Date];
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

defineExpose({ scrollToIndex });

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

// Auto-scroll to bottom when tailing, reset scroll when lines array is replaced entirely
let prevLinesRef: LogLine[] | null = null;
watch(() => props.lines, (newLines) => {
  if (!containerRef.value) return;

  // Lines array replaced (different file or re-parse) — reset to top
  if (prevLinesRef !== null && newLines !== prevLinesRef && !props.autoScroll) {
    containerRef.value.scrollTop = 0;
    scrollTop.value = 0;
  }

  // Auto-scroll to bottom when tailing
  if (props.autoScroll) {
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
        scrollTop.value = containerRef.value.scrollTop;
      }
    });
  }

  prevLinesRef = newLines;
}, { deep: true });

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightSearch(content: string): string {
  const escaped = escapeHtml(content);
  if (!props.searchPattern) return escaped;

  try {
    return escaped.replace(props.searchPattern, (match) =>
      `<mark class="bg-accent/30 text-inherit rounded px-0.5">${match}</mark>`
    );
  } catch {
    return escaped;
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
