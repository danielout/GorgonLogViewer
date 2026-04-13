<template>
  <div
    v-if="info"
    class="absolute z-20 bg-bg-surface border border-border rounded shadow-lg p-3 max-w-md text-sm pointer-events-none"
    :style="{ top: y + 'px', left: x + 'px' }"
  >
    <p class="font-bold text-accent mb-1">{{ info.name }}</p>
    <p class="text-text-primary mb-2">{{ info.summary }}</p>
    <div v-if="info.fields?.length" class="text-xs">
      <div class="text-text-muted mb-0.5">Fields:</div>
      <div v-for="field in info.fields" :key="field.name" class="flex gap-2 font-mono pl-2">
        <span class="text-syn-keyword">{{ field.name }}</span>
        <span class="text-syn-number">{{ field.type }}</span>
      </div>
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
