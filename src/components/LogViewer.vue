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
          :class="lineTypeClass(line.type)"
        >
          <span class="w-14 shrink-0 text-right pr-3 text-text-muted select-none">{{ line.lineNumber }}</span>
          <span v-if="line.timestamp" class="shrink-0 pr-3 text-log-timestamp select-none">{{ line.timestamp }}</span>
          <span class="whitespace-pre-wrap break-all min-w-0" v-html="highlightSearch(line.content)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { LogLine, LogLineType } from "../lib/types";

const props = defineProps<{
  lines: LogLine[];
  searchPattern: RegExp | null;
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

function onScroll() {
  if (!containerRef.value) return;
  scrollTop.value = containerRef.value.scrollTop;
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

function lineTypeClass(type: LogLineType): string {
  const map: Partial<Record<LogLineType, string>> = {
    "chat-global": "text-log-chat-global",
    "chat-help": "text-log-chat-help",
    "chat-nearby": "text-log-chat-nearby",
    "chat-guild": "text-log-chat-guild",
    "chat-trade": "text-log-chat-trade",
    combat: "text-log-combat",
    status: "text-log-status",
    npc: "text-log-npc",
    action: "text-log-action",
    system: "text-log-system",
    item: "text-log-item",
    skill: "text-log-skill",
  };
  return map[type] ?? "text-text-secondary";
}

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
</script>
