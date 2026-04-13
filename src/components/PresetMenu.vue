<template>
  <div class="relative" ref="containerRef">
    <button
      class="text-sm px-3 py-1.5 rounded border border-border bg-bg-surface text-text-secondary hover:text-text-primary transition-colors"
      @click="showMenu = !showMenu"
    >
      Presets
    </button>

    <div
      v-if="showMenu"
      class="absolute right-0 top-full mt-1 bg-bg-surface border border-border rounded shadow-lg z-20 min-w-56"
    >
      <!-- Saved presets -->
      <div v-if="presets.length" class="max-h-48 overflow-y-auto border-b border-border">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          @click="loadPreset(preset)"
        >
          <span class="flex-1 truncate">{{ preset.name }}</span>
          <button
            class="text-text-muted hover:text-accent text-xs shrink-0"
            title="Export to clipboard"
            @click.stop="handleExport(preset)"
          >
            copy
          </button>
          <button
            class="text-text-muted hover:text-log-combat text-xs shrink-0"
            @click.stop="deletePreset(preset.id)"
          >
            &times;
          </button>
        </div>
      </div>
      <div v-else class="px-3 py-2 text-xs text-text-muted border-b border-border">
        No saved presets
      </div>

      <!-- Actions -->
      <div class="p-1.5 space-y-0.5">
        <button
          class="w-full text-left text-sm px-2 py-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          @click="handleSave"
        >
          Save current view...
        </button>
        <button
          class="w-full text-left text-sm px-2 py-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          @click="showImport = true"
        >
          Import from JSON...
        </button>
      </div>

      <!-- Save dialog -->
      <div v-if="showSaveDialog" class="border-t border-border p-2">
        <input
          ref="saveNameInput"
          v-model="saveName"
          placeholder="Preset name"
          class="w-full bg-bg-primary text-text-primary text-sm px-2 py-1 rounded border border-border focus:border-accent focus:outline-none mb-1.5"
          @keydown.enter="confirmSave"
        />
        <div class="flex gap-1">
          <button class="flex-1 text-xs px-2 py-1 rounded bg-accent text-bg-primary" @click="confirmSave">Save</button>
          <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-hover text-text-secondary" @click="showSaveDialog = false">Cancel</button>
        </div>
      </div>

      <!-- Import dialog -->
      <div v-if="showImport" class="border-t border-border p-2">
        <textarea
          v-model="importText"
          placeholder="Paste preset JSON..."
          class="w-full h-20 bg-bg-primary text-text-primary text-xs px-2 py-1 rounded border border-border focus:border-accent focus:outline-none font-mono resize-none mb-1.5"
        ></textarea>
        <div class="flex gap-1">
          <button class="flex-1 text-xs px-2 py-1 rounded bg-accent text-bg-primary" @click="doImport">Import</button>
          <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-hover text-text-secondary" @click="showImport = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import type { ViewPreset } from "../lib/types";
import { loadPresets, savePresets, exportPreset, importPreset } from "../lib/view-presets";

const emit = defineEmits<{
  save: [name: string];
  load: [preset: ViewPreset];
}>();

const presets = ref<ViewPreset[]>(loadPresets());
const showMenu = ref(false);
const showSaveDialog = ref(false);
const showImport = ref(false);
const saveName = ref("");
const importText = ref("");
const containerRef = ref<HTMLElement | null>(null);
const saveNameInput = ref<HTMLInputElement | null>(null);

function handleSave() {
  saveName.value = "";
  showSaveDialog.value = true;
  showImport.value = false;
  nextTick(() => saveNameInput.value?.focus());
}

function confirmSave() {
  if (!saveName.value.trim()) return;
  emit("save", saveName.value.trim());
  showSaveDialog.value = false;
  showMenu.value = false;
  // Reload presets from storage after parent saves
  nextTick(() => { presets.value = loadPresets(); });
}

function loadPreset(preset: ViewPreset) {
  emit("load", preset);
  showMenu.value = false;
}

function deletePreset(id: string) {
  presets.value = presets.value.filter((p) => p.id !== id);
  savePresets(presets.value);
}

function handleExport(preset: ViewPreset) {
  navigator.clipboard.writeText(exportPreset(preset));
}

function doImport() {
  const preset = importPreset(importText.value);
  if (!preset) return;
  presets.value.push(preset);
  savePresets(presets.value);
  showImport.value = false;
  emit("load", preset);
  showMenu.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showMenu.value = false;
    showSaveDialog.value = false;
    showImport.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>
