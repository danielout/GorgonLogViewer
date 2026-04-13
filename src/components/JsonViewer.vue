<template>
  <div class="flex-1 overflow-auto p-4 font-mono text-sm">
    <div v-if="parseError" class="text-log-combat">
      Failed to parse JSON: {{ parseError }}
    </div>
    <template v-else>
      <JsonNode :data="parsed" :depth="0" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import JsonNode from "./JsonNode.vue";

const props = defineProps<{
  content: string;
}>();

const parseError = computed(() => {
  try {
    JSON.parse(props.content);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
});

const parsed = computed(() => {
  try {
    return JSON.parse(props.content);
  } catch {
    return null;
  }
});
</script>
