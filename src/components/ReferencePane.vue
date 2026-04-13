<template>
  <div class="flex flex-col h-full bg-bg-secondary border-l border-border w-96 shrink-0">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border">
      <h2 class="text-sm font-bold text-accent">Reference</h2>
      <button class="text-text-muted hover:text-text-primary text-lg" @click="$emit('close')">&times;</button>
    </div>

    <!-- Search -->
    <div class="px-3 py-2 border-b border-border">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search events, channels, formats..."
        class="w-full bg-bg-surface text-text-primary text-sm px-3 py-1.5 rounded border border-border focus:border-accent focus:outline-none placeholder:text-text-muted"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredEntries.length === 0" class="p-4 text-text-muted text-sm text-center">
        No results for "{{ searchQuery }}"
      </div>

      <div v-for="category in visibleCategories" :key="category" class="border-b border-border/50">
        <!-- Category header -->
        <button
          class="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-text-muted hover:text-text-secondary uppercase tracking-wider"
          @click="toggleCategory(category)"
        >
          <span class="w-3 text-center">{{ expandedCategories.has(category) ? '▼' : '▶' }}</span>
          {{ category }}
          <span class="text-text-muted/50 font-normal normal-case">({{ entriesForCategory(category).length }})</span>
        </button>

        <!-- Entries -->
        <div v-if="expandedCategories.has(category)">
          <div
            v-for="entry in entriesForCategory(category)"
            :key="entry.name"
            class="border-t border-border/30"
          >
            <!-- Entry header -->
            <button
              class="flex items-center gap-2 w-full px-4 py-1.5 text-left text-sm hover:bg-bg-hover/30 transition-colors"
              @click="toggleEntry(entry.name)"
            >
              <span class="w-3 text-center text-text-muted text-xs">{{ expandedEntries.has(entry.name) ? '▼' : '▶' }}</span>
              <span class="text-accent">{{ entry.name }}</span>
            </button>

            <!-- Entry detail -->
            <div v-if="expandedEntries.has(entry.name)" class="px-4 pb-3 ml-5 text-sm space-y-2">
              <p class="text-text-primary">{{ entry.description }}</p>

              <!-- Format -->
              <div v-if="entry.format" class="font-mono text-xs bg-bg-surface rounded px-2 py-1.5 text-text-secondary overflow-x-auto whitespace-nowrap">
                {{ entry.format }}
              </div>

              <!-- Fields -->
              <div v-if="entry.fields?.length">
                <div class="text-xs text-text-muted mb-1">Fields:</div>
                <table class="w-full text-xs">
                  <tr
                    v-for="field in entry.fields"
                    :key="field.name"
                    class="border-b border-border/20"
                  >
                    <td class="py-0.5 pr-2 text-log-item font-mono whitespace-nowrap">{{ field.name }}</td>
                    <td class="py-0.5 pr-2 text-log-skill whitespace-nowrap">{{ field.type }}</td>
                    <td class="py-0.5 text-text-secondary">{{ field.description }}</td>
                  </tr>
                </table>
              </div>

              <!-- When it fires -->
              <div v-if="entry.whenItFires?.length">
                <div class="text-xs text-text-muted mb-1">When it fires:</div>
                <ul class="text-xs text-text-secondary list-disc list-inside space-y-0.5">
                  <li v-for="(when, i) in entry.whenItFires" :key="i">{{ when }}</li>
                </ul>
              </div>

              <!-- Notes -->
              <div v-if="entry.notes?.length">
                <div class="text-xs text-text-muted mb-1">Notes:</div>
                <ul class="text-xs text-text-secondary list-disc list-inside space-y-0.5">
                  <li v-for="(note, i) in entry.notes" :key="i">{{ note }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { allRefEntries, refCategories, type RefEntry } from "../lib/reference-data";

defineEmits<{
  close: [];
}>();

const searchQuery = ref("");
const expandedCategories = ref(new Set<string>());
const expandedEntries = ref(new Set<string>());

const filteredEntries = computed<RefEntry[]>(() => {
  if (!searchQuery.value.trim()) return allRefEntries;
  const q = searchQuery.value.toLowerCase();
  return allRefEntries.filter((entry) => {
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.includes(q)) ||
      entry.fields?.some((f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) ||
      entry.notes?.some((n) => n.toLowerCase().includes(q))
    );
  });
});

const visibleCategories = computed(() => {
  const cats = new Set(filteredEntries.value.map((e) => e.category));
  return refCategories.filter((c) => cats.has(c));
});

function entriesForCategory(category: string): RefEntry[] {
  return filteredEntries.value.filter((e) => e.category === category);
}

function toggleCategory(category: string) {
  const s = new Set(expandedCategories.value);
  if (s.has(category)) s.delete(category);
  else s.add(category);
  expandedCategories.value = s;
}

function toggleEntry(name: string) {
  const s = new Set(expandedEntries.value);
  if (s.has(name)) s.delete(name);
  else s.add(name);
  expandedEntries.value = s;
}
</script>
