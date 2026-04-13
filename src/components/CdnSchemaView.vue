<template>
  <div class="p-4 overflow-auto font-mono text-sm">
    <div class="mb-4">
      <h2 class="text-accent font-bold text-base mb-1">{{ schema.fileName }}</h2>
      <p class="text-text-secondary text-xs">
        Root: {{ schema.rootType }} &middot; {{ schema.entryCount }} entries &middot; {{ schema.fields.length }} fields
      </p>
    </div>

    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-border text-text-muted text-xs">
          <th class="py-1 pr-4">Field</th>
          <th class="py-1 pr-4">Type</th>
          <th class="py-1 pr-4">Presence</th>
          <th class="py-1">Samples</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="field in schema.fields" :key="field.name">
          <tr class="border-b border-border/50 hover:bg-bg-hover/30">
            <td class="py-1.5 pr-4 text-log-item">{{ field.name }}</td>
            <td class="py-1.5 pr-4 text-log-skill">{{ formatTypes(field.types) }}</td>
            <td class="py-1.5 pr-4" :class="field.count === field.total ? 'text-log-chat-global' : 'text-text-muted'">
              {{ field.count }}/{{ field.total }}
              <span v-if="field.count === field.total" class="text-xs ml-1">(required)</span>
              <span v-else class="text-xs ml-1">({{ Math.round(field.count / field.total * 100) }}%)</span>
            </td>
            <td class="py-1.5 text-text-secondary text-xs truncate max-w-64">
              {{ field.samples.join(' | ') }}
            </td>
          </tr>
          <!-- Child fields (1 level deep) -->
          <tr
            v-for="child in field.children ?? []"
            :key="`${field.name}.${child.name}`"
            class="border-b border-border/30 hover:bg-bg-hover/20"
          >
            <td class="py-1 pr-4 pl-6 text-log-item/70">.{{ child.name }}</td>
            <td class="py-1 pr-4 text-log-skill/70">{{ formatTypes(child.types) }}</td>
            <td class="py-1 pr-4 text-text-muted text-xs">
              {{ child.count }}/{{ child.total }}
            </td>
            <td class="py-1 text-text-secondary text-xs truncate max-w-64">
              {{ child.samples.join(' | ') }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CdnSchemaInfo } from "../lib/cdn-schema";

defineProps<{
  schema: CdnSchemaInfo;
}>();

function formatTypes(types: Set<string>): string {
  return [...types].join(" | ");
}
</script>
