<template>
  <div
    v-if="info"
    class="absolute z-20 bg-bg-surface border border-border rounded shadow-lg p-3 max-w-sm text-sm pointer-events-none"
    :style="{ top: y + 'px', left: x + 'px' }"
  >
    <p class="font-bold text-accent mb-1">{{ info.name }}</p>
    <p class="text-text-primary mb-2">{{ info.summary }}</p>
    <div v-if="info.fields?.length" class="text-text-secondary text-xs">
      <span class="text-text-muted">Fields: </span>
      <span class="font-mono">{{ info.fields.join(', ') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventInfo } from "../lib/event-reference";

defineProps<{
  info: EventInfo | null;
  x: number;
  y: number;
}>();
</script>
