<template>
  <div :style="{ paddingLeft: depth > 0 ? '1.25rem' : '0' }">
    <!-- Object or Array -->
    <template v-if="isExpandable">
      <button
        class="flex items-center gap-1 hover:bg-bg-hover/50 rounded px-1 -ml-1"
        @click="expanded = !expanded"
      >
        <span class="text-text-muted w-4 text-center select-none">{{ expanded ? '▼' : '▶' }}</span>
        <span v-if="label" class="text-accent">{{ label }}</span>
        <span class="text-text-muted">{{ bracketLabel }}</span>
      </button>
      <div v-if="expanded">
        <JsonNode
          v-for="childKey in childKeys"
          :key="childKey"
          :data="(data as Record<string, unknown>)[childKey]"
          :label="isArray ? undefined : childKey"
          :depth="depth + 1"
        />
      </div>
    </template>

    <!-- Primitive value -->
    <template v-else>
      <div class="flex items-baseline gap-1 px-1">
        <span class="w-4 shrink-0"></span>
        <span v-if="label" class="text-accent">{{ label }}:</span>
        <span :class="valueClass">{{ displayValue }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = withDefaults(defineProps<{
  data: unknown;
  label?: string;
  depth: number;
}>(), {
  label: undefined,
});

const expanded = ref(props.depth < 1);

const isArray = computed(() => Array.isArray(props.data));
const isObject = computed(() => props.data !== null && typeof props.data === "object");
const isExpandable = computed(() => isObject.value);

const childKeys = computed(() => {
  if (!isObject.value) return [];
  return Object.keys(props.data as Record<string, unknown>);
});

const itemCount = computed(() => childKeys.value.length);

const bracketLabel = computed(() =>
  isArray.value ? `[${itemCount.value}]` : `{${itemCount.value}}`
);

const displayValue = computed(() => {
  if (props.data === null) return "null";
  if (typeof props.data === "string") return `"${props.data}"`;
  return String(props.data);
});

const valueClass = computed(() => {
  if (props.data === null) return "text-text-muted italic";
  if (typeof props.data === "string") return "text-log-chat-global";
  if (typeof props.data === "number") return "text-log-chat-help";
  if (typeof props.data === "boolean") return "text-log-skill";
  return "text-text-primary";
});
</script>
