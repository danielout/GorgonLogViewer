<template>
  <div class="flex h-full shrink-0">
    <ResizeHandle @resize="onResize" />
    <div class="flex flex-col h-full bg-bg-secondary border-l border-border overflow-hidden" :style="{ width: panelWidth + 'px' }">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border">
      <h2 class="text-sm font-bold text-accent">Filter Configs</h2>
      <button class="text-text-muted hover:text-text-primary text-lg" @click="$emit('close')">&times;</button>
    </div>

    <!-- Config list -->
    <div class="border-b border-border p-2 space-y-1 max-h-40 overflow-y-auto">
      <div
        v-for="config in allConfigs"
        :key="config.id"
        class="flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer transition-colors"
        :class="config.id === activeConfigId
          ? 'bg-bg-surface text-text-primary'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'"
        @click="selectConfig(config)"
      >
        <span class="truncate flex-1">{{ config.name }}</span>
        <span v-if="isBuiltIn(config)" class="text-xs text-text-muted">built-in</span>
        <button
          v-else
          class="text-text-muted hover:text-log-combat shrink-0 text-xs"
          @click.stop="deleteConfig(config.id)"
        >
          &times;
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-1 p-2 border-b border-border">
      <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-surface border border-border text-text-secondary hover:text-text-primary" @click="createNew">New</button>
      <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-surface border border-border text-text-secondary hover:text-text-primary" @click="duplicateActive">Duplicate</button>
      <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-surface border border-border text-text-secondary hover:text-text-primary" @click="handleExport">Export</button>
      <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-surface border border-border text-text-secondary hover:text-text-primary" @click="handleImport">Import</button>
    </div>

    <!-- Editor (only for user configs) -->
    <div v-if="editableConfig" class="flex-1 overflow-y-auto p-3 space-y-3">
      <!-- Name -->
      <div>
        <label class="text-xs text-text-muted block mb-1">Name</label>
        <input
          v-model="editableConfig.name"
          class="w-full bg-bg-surface text-text-primary text-sm px-2 py-1 rounded border border-border focus:border-accent focus:outline-none"
          @input="onConfigChange"
        />
      </div>

      <!-- Highlight rules -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-text-muted">Highlight Rules</label>
          <button class="text-xs text-accent hover:text-accent-hover" @click="addRule">+ Add</button>
        </div>
        <div
          v-for="(rule, idx) in editableConfig.highlights"
          :key="idx"
          class="flex items-center gap-1.5 mb-1.5 p-1.5 rounded bg-bg-surface"
        >
          <input
            type="checkbox"
            :checked="rule.enabled"
            class="accent-accent shrink-0"
            @change="rule.enabled = !rule.enabled; onConfigChange()"
          />
          <input
            v-model="rule.name"
            placeholder="Name"
            class="w-16 bg-bg-primary text-text-primary text-xs px-1.5 py-0.5 rounded border border-border focus:border-accent focus:outline-none"
            @input="onConfigChange"
          />
          <input
            v-model="rule.pattern"
            placeholder="Pattern"
            class="flex-1 bg-bg-primary text-text-primary text-xs px-1.5 py-0.5 rounded border border-border focus:border-accent focus:outline-none font-mono"
            @input="onConfigChange"
          />
          <button
            class="text-xs px-1 rounded font-mono"
            :class="rule.isRegex ? 'bg-accent text-bg-primary' : 'text-text-muted'"
            title="Toggle regex"
            @click="rule.isRegex = !rule.isRegex; onConfigChange()"
          >.*</button>
          <input
            type="color"
            :value="rule.color"
            class="w-5 h-5 border-0 p-0 cursor-pointer shrink-0"
            @input="rule.color = ($event.target as HTMLInputElement).value; onConfigChange()"
          />
          <button
            class="text-text-muted hover:text-log-combat text-xs shrink-0"
            @click="removeRule(idx)"
          >&times;</button>
        </div>
      </div>
    </div>
    <div v-else-if="activeConfigId" class="flex-1 flex items-center justify-center p-4 text-text-muted text-sm text-center">
      Built-in configs can't be edited. Duplicate to customize.
    </div>

    <!-- Import dialog -->
    <div v-if="showImportDialog" class="absolute inset-0 bg-bg-primary/80 flex items-center justify-center z-30">
      <div class="bg-bg-surface border border-border rounded p-4 w-72">
        <h3 class="text-sm font-bold text-text-primary mb-2">Import Config</h3>
        <textarea
          v-model="importText"
          placeholder="Paste JSON here..."
          class="w-full h-32 bg-bg-primary text-text-primary text-xs px-2 py-1 rounded border border-border focus:border-accent focus:outline-none font-mono resize-none"
        ></textarea>
        <div class="flex gap-2 mt-2">
          <button class="flex-1 text-xs px-2 py-1 rounded bg-accent text-bg-primary" @click="doImport">Import</button>
          <button class="flex-1 text-xs px-2 py-1 rounded bg-bg-hover text-text-secondary" @click="showImportDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { FilterConfig } from "../lib/types";
import ResizeHandle from "./ResizeHandle.vue";
import {
  builtInConfigs,
  loadUserConfigs,
  saveUserConfigs,
  createEmptyConfig,
  exportConfig,
  importConfig,
} from "../lib/filter-config";

const emit = defineEmits<{
  close: [];
  apply: [config: FilterConfig];
}>();

const panelWidth = ref(320);

function onResize(delta: number) {
  panelWidth.value = Math.max(200, Math.min(600, panelWidth.value - delta));
}

const userConfigs = ref<FilterConfig[]>(loadUserConfigs());
const activeConfigId = ref<string>(builtInConfigs[0].id);
const showImportDialog = ref(false);
const importText = ref("");

const allConfigs = computed(() => [...builtInConfigs, ...userConfigs.value]);

const editableConfig = computed(() => {
  if (isBuiltIn({ id: activeConfigId.value } as FilterConfig)) return null;
  return userConfigs.value.find((c) => c.id === activeConfigId.value) ?? null;
});

function isBuiltIn(config: { id: string }): boolean {
  return builtInConfigs.some((c) => c.id === config.id);
}

function selectConfig(config: FilterConfig) {
  activeConfigId.value = config.id;
  emit("apply", config);
}

function onConfigChange() {
  saveUserConfigs(userConfigs.value);
  const config = editableConfig.value;
  if (config) emit("apply", config);
}

function createNew() {
  const config = createEmptyConfig();
  userConfigs.value.push(config);
  saveUserConfigs(userConfigs.value);
  activeConfigId.value = config.id;
  emit("apply", config);
}

function duplicateActive() {
  const source = allConfigs.value.find((c) => c.id === activeConfigId.value);
  if (!source) return;
  const dup: FilterConfig = {
    ...JSON.parse(JSON.stringify(source)),
    name: `${source.name} (copy)`,
    id: `user-${Date.now()}`,
  };
  userConfigs.value.push(dup);
  saveUserConfigs(userConfigs.value);
  activeConfigId.value = dup.id;
  emit("apply", dup);
}

function deleteConfig(id: string) {
  userConfigs.value = userConfigs.value.filter((c) => c.id !== id);
  saveUserConfigs(userConfigs.value);
  if (activeConfigId.value === id) {
    activeConfigId.value = builtInConfigs[0].id;
    emit("apply", builtInConfigs[0]);
  }
}

function addRule() {
  if (!editableConfig.value) return;
  editableConfig.value.highlights.push({
    name: "",
    pattern: "",
    isRegex: false,
    color: "#a6e3a1",
    enabled: true,
  });
  onConfigChange();
}

function removeRule(idx: number) {
  if (!editableConfig.value) return;
  editableConfig.value.highlights.splice(idx, 1);
  onConfigChange();
}

function handleExport() {
  const config = allConfigs.value.find((c) => c.id === activeConfigId.value);
  if (!config) return;
  const json = exportConfig(config);
  navigator.clipboard.writeText(json);
}

function handleImport() {
  importText.value = "";
  showImportDialog.value = true;
}

function doImport() {
  const config = importConfig(importText.value);
  if (!config) return;
  userConfigs.value.push(config);
  saveUserConfigs(userConfigs.value);
  activeConfigId.value = config.id;
  emit("apply", config);
  showImportDialog.value = false;
}
</script>
