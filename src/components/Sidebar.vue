<template>
  <aside class="w-56 bg-bg-secondary border-r border-border flex flex-col shrink-0">
    <div class="p-3 border-b border-border">
      <h1 class="text-sm font-bold text-accent tracking-wide">Gorgon Log Viewer</h1>
    </div>

    <div class="p-2">
      <button
        class="w-full text-left px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        @click="$emit('openFile')"
      >
        + Open File
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-2">
      <!-- Open files -->
      <div
        v-for="file in openFiles"
        :key="file.path"
        class="group flex items-center gap-1 px-3 py-1.5 rounded text-sm cursor-pointer transition-colors"
        :class="file.path === activeFile
          ? 'bg-bg-surface text-text-primary'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'"
        @click="$emit('selectFile', file.path)"
      >
        <span class="truncate flex-1" :title="file.path">{{ file.name }}</span>
        <button
          class="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary shrink-0"
          @click.stop="$emit('closeFile', file.path)"
        >
          &times;
        </button>
      </div>

      <!-- Samples section -->
      <div v-if="samplesByCategory.size > 0" class="mt-3">
        <button
          class="flex items-center gap-1 px-3 py-1 text-xs text-text-muted hover:text-text-secondary w-full text-left"
          @click="showSamples = !showSamples"
        >
          <span class="w-3 text-center">{{ showSamples ? '▼' : '▶' }}</span>
          Samples
        </button>
        <div v-if="showSamples" class="ml-2">
          <div v-for="[category, files] in samplesByCategory" :key="category" class="mb-1">
            <div class="px-3 py-0.5 text-xs text-text-muted">{{ category }}</div>
            <div
              v-for="sample in files"
              :key="sample.path"
              class="px-3 py-1 text-xs cursor-pointer text-text-secondary hover:bg-bg-hover hover:text-text-primary rounded truncate transition-colors"
              :title="sample.name"
              @click="$emit('openSample', sample.path)"
            >
              {{ sample.name }}
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="p-2 border-t border-border">
      <router-link
        to="/paired"
        class="block w-full text-left px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
      >
        Paired View
      </router-link>
      <router-link
        to="/"
        class="block w-full text-left px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
      >
        Single View
      </router-link>
    </div>
    <div class="p-2 border-t border-border">
      <ThemePicker />
    </div>
    <div class="p-3 border-t border-border text-xs text-text-muted">
      v0.1.0
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { OpenFile } from "../lib/types";
import { listSampleFiles, type SampleFile } from "../lib/tauri-bridge";
import ThemePicker from "./ThemePicker.vue";

defineProps<{
  openFiles: OpenFile[];
  activeFile: string | null;
}>();

defineEmits<{
  openFile: [];
  selectFile: [path: string];
  closeFile: [path: string];
  openSample: [path: string];
}>();

const samples = ref<SampleFile[]>([]);
const showSamples = ref(false);

const samplesByCategory = computed(() => {
  const map = new Map<string, SampleFile[]>();
  for (const s of samples.value) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return map;
});

onMounted(async () => {
  try {
    samples.value = await listSampleFiles();
  } catch {
    // Samples may not be available in dev mode without resource bundling
  }
});
</script>
