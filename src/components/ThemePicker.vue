<template>
  <div class="relative" ref="containerRef">
    <button
      class="w-full text-left px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
      @click="showPicker = !showPicker"
    >
      Theme: {{ activeTheme.name }}
    </button>

    <div
      v-if="showPicker"
      class="absolute bottom-full left-0 mb-1 bg-bg-surface border border-border rounded shadow-lg z-20 p-1 min-w-44"
    >
      <button
        v-for="theme in builtInThemes"
        :key="theme.id"
        class="block w-full text-left px-3 py-1.5 rounded text-sm transition-colors"
        :class="theme.id === activeTheme.id
          ? 'bg-accent/20 text-accent'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'"
        @click="selectTheme(theme)"
      >
        {{ theme.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { builtInThemes, applyTheme, loadSavedThemeId, saveThemeId, defaultTheme, type Theme } from "../lib/themes";

const showPicker = ref(false);
const activeTheme = ref<Theme>(defaultTheme);
const containerRef = ref<HTMLElement | null>(null);

function selectTheme(theme: Theme) {
  activeTheme.value = theme;
  applyTheme(theme);
  saveThemeId(theme.id);
  showPicker.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showPicker.value = false;
  }
}

onMounted(() => {
  const savedId = loadSavedThemeId();
  const saved = builtInThemes.find((t) => t.id === savedId);
  if (saved) {
    activeTheme.value = saved;
    applyTheme(saved);
  }
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
