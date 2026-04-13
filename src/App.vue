<template>
  <div class="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
    <Sidebar
      :open-files="openFiles"
      :active-file="activeFile"
      @select-file="activeFile = $event"
      @open-file="handleOpenFile"
      @close-file="handleCloseFile"
    />
    <main class="flex-1 flex flex-col min-w-0">
      <router-view
        :active-file="activeFile"
        :open-files="openFiles"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { readLogFile } from "./lib/tauri-bridge";
import { parseLogFile } from "./lib/log-parser";
import type { OpenFile } from "./lib/types";
import Sidebar from "./components/Sidebar.vue";

const openFiles = ref<OpenFile[]>([]);
const activeFile = ref<string | null>(null);

async function handleOpenFile() {
  const selected = await open({
    multiple: false,
    filters: [
      { name: "Log Files", extensions: ["log"] },
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!selected) return;

  const filePath = selected as string;

  if (openFiles.value.some((f) => f.path === filePath)) {
    activeFile.value = filePath;
    return;
  }

  const content = await readLogFile(filePath);
  const lines = parseLogFile(content, filePath);
  const fileName = filePath.split(/[\\/]/).pop() || filePath;

  openFiles.value.push({
    path: filePath,
    name: fileName,
    lines,
    rawContent: content,
  });

  activeFile.value = filePath;
}

function handleCloseFile(path: string) {
  const idx = openFiles.value.findIndex((f) => f.path === path);
  if (idx === -1) return;
  openFiles.value.splice(idx, 1);
  if (activeFile.value === path) {
    activeFile.value = openFiles.value[0]?.path ?? null;
  }
}
</script>
