<template>
  <div class="text-xs">
    <!-- Root folders -->
    <div v-for="root in roots" :key="root.path">
      <FolderNode
        :path="root.path"
        :label="root.label"
        :initial-open="root.autoExpand"
        @open-file="$emit('openFile', $event)"
      />
    </div>

    <!-- Add folder button -->
    <button
      class="w-full text-left px-3 py-1 text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded transition-colors mt-1"
      @click="addFolder"
    >
      + Add Folder
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPgAppdataPath } from "../lib/tauri-bridge";
import { open } from "@tauri-apps/plugin-dialog";
import FolderNode from "./FolderNode.vue";

defineEmits<{
  openFile: [path: string];
}>();

interface RootFolder {
  label: string;
  path: string;
  autoExpand: boolean;
}

const STORAGE_KEY = "glv-custom-folders";

const roots = ref<RootFolder[]>([]);

function loadCustomFolders(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomFolders(folders: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
}

onMounted(async () => {
  // Add PG AppData as the default root
  const pgPath = await getPgAppdataPath();
  if (pgPath) {
    roots.value.push({ label: "Project Gorgon", path: pgPath, autoExpand: true });
  }

  // Add saved custom folders
  for (const folder of loadCustomFolders()) {
    const name = folder.split(/[\\/]/).pop() || folder;
    roots.value.push({ label: name, path: folder, autoExpand: false });
  }
});

async function addFolder() {
  const selected = await open({ directory: true, multiple: false });
  if (!selected) return;
  const folderPath = selected as string;

  // Don't add duplicates
  if (roots.value.some((r) => r.path === folderPath)) return;

  const name = folderPath.split(/[\\/]/).pop() || folderPath;
  roots.value.push({ label: name, path: folderPath, autoExpand: true });

  // Persist
  const customFolders = loadCustomFolders();
  customFolders.push(folderPath);
  saveCustomFolders(customFolders);
}
</script>
