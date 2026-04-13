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
          <span class="w-36 shrink-0 pr-3 text-log-timestamp select-none">{{ line.timestamp ?? '' }}</span>
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
  openReference: [name: string];
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

// Track which line number is at the top of the viewport for scroll preservation
let prevFirstLineNumber: number | null = null;

watch(() => props.lines, (newLines, oldLines) => {
  if (!containerRef.value) return;

  // Auto-scroll to bottom when tailing
  if (props.autoScroll) {
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
        scrollTop.value = containerRef.value.scrollTop;
      }
    });
  
    return;
  }

  // Different file entirely (no old lines, or first line number jumped drastically) — reset to top
  if (!oldLines || oldLines.length === 0) {
    containerRef.value.scrollTop = 0;
    scrollTop.value = 0;
  
    return;
  }

  // Filter changed — try to keep the same line visible
  if (prevFirstLineNumber !== null && newLines.length > 0) {
    const targetLine = prevFirstLineNumber;
    // Find the index of the first line at or after our previous position
    let bestIdx = 0;
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].lineNumber >= targetLine) {
        bestIdx = i;
        break;
      }
      bestIdx = i;
    }
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = bestIdx * LINE_HEIGHT;
        scrollTop.value = containerRef.value.scrollTop;
      }
    });
  }


});

// Keep track of which original line number is at the top of the viewport
watch(startIndex, () => {
  if (props.lines.length > 0 && startIndex.value < props.lines.length) {
    prevFirstLineNumber = props.lines[startIndex.value]?.lineNumber ?? null;
  }
});

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
