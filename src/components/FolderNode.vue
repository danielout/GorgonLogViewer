<template>
  <div>
    <!-- Folder header -->
    <button
      class="flex items-center gap-1 w-full px-3 py-1 text-left hover:bg-bg-hover rounded transition-colors"
      :class="expanded ? 'text-text-primary' : 'text-text-secondary'"
      @click="toggle"
    >
      <span class="w-3 text-center text-text-muted">{{ expanded ? '▼' : '▶' }}</span>
      <span class="truncate" :title="path">{{ label }}</span>
    </button>

    <!-- Children -->
    <div v-if="expanded" class="ml-2">
      <div v-if="loading" class="px-3 py-1 text-text-muted italic">Loading...</div>
      <div v-else-if="error" class="px-3 py-1 text-log-error">{{ error }}</div>
      <template v-else>
        <template v-for="entry in entries" :key="entry.path">
          <!-- Subdirectory -->
          <FolderNode
            v-if="entry.is_dir"
            :path="entry.path"
            :label="entry.name"
            @open-file="$emit('openFile', $event)"
          />
          <!-- File -->
          <button
            v-else
            class="flex items-center gap-1 w-full px-3 py-1 text-left text-text-secondary hover:bg-bg-hover hover:text-text-primary rounded transition-colors truncate"
            :title="entry.path"
            @click="$emit('openFile', entry.path)"
          >
            <span class="w-3 text-center text-text-muted text-[10px]">{{ fileIcon(entry.name) }}</span>
            <span class="truncate">{{ entry.name }}</span>
          </button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { listDirectory, type FileEntry } from "../lib/tauri-bridge";

const props = withDefaults(defineProps<{
  path: string;
  label: string;
  initialOpen?: boolean;
}>(), {
  initialOpen: false,
});

defineEmits<{
  openFile: [path: string];
}>();

const expanded = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const entries = ref<FileEntry[]>([]);
let loaded = false;

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "log" || ext === "txt") return "📄";
  if (ext === "json") return "{ }";
  return "·";
}

async function loadEntries() {
  if (loaded) return;
  loading.value = true;
  error.value = null;
  try {
    entries.value = await listDirectory(props.path);
    loaded = true;
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
}

function toggle() {
  expanded.value = !expanded.value;
  if (expanded.value) loadEntries();
}

onMounted(() => {
  if (props.initialOpen) {
    expanded.value = true;
    loadEntries();
  }
});
</script>
