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
    <div class="p-3 border-t border-border text-xs text-text-muted">
      v0.1.0
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { OpenFile } from "../lib/types";

defineProps<{
  openFiles: OpenFile[];
  activeFile: string | null;
}>();

defineEmits<{
  openFile: [];
  selectFile: [path: string];
  closeFile: [path: string];
}>();
</script>
