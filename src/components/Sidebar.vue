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

      <!-- File browser -->
      <div class="mt-3 border-t border-border/50 pt-2">
        <div class="px-3 py-1 text-xs text-text-muted font-semibold uppercase tracking-wider">Files</div>
        <FileBrowser @open-file="$emit('openSample', $event)" />
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
      <button
        class="block w-full text-left px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        @click="$emit('toggleReference')"
      >
        Reference
      </button>
    </div>
    <div class="p-2 border-t border-border">
      <ThemePicker />
    </div>
    <div class="p-3 border-t border-border text-xs">
      <template v-if="versionInfo?.update_available">
        <a
          :href="versionInfo.release_url ?? '#'"
          target="_blank"
          class="text-accent hover:text-accent-hover cursor-pointer"
          title="Click to download update"
        >
          v{{ versionInfo.current }} — v{{ versionInfo.latest }} available!
        </a>
      </template>
      <span v-else class="text-text-muted">
        v{{ versionInfo?.current ?? '...' }}
      </span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { OpenFile } from "../lib/types";
import { checkForUpdates, type VersionInfo } from "../lib/tauri-bridge";
import ThemePicker from "./ThemePicker.vue";
import FileBrowser from "./FileBrowser.vue";

defineProps<{
  openFiles: OpenFile[];
  activeFile: string | null;
}>();

defineEmits<{
  openFile: [];
  selectFile: [path: string];
  closeFile: [path: string];
  openSample: [path: string];
  toggleReference: [];
}>();

const versionInfo = ref<VersionInfo | null>(null);

onMounted(async () => {
  try {
    versionInfo.value = await checkForUpdates();
  } catch {
    // Offline or API error — just show current version
    versionInfo.value = { current: "0.1.0", latest: null, update_available: false, release_url: null };
  }
});
</script>
