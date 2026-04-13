<template>
  <div class="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
    <Sidebar
      :open-files="openFiles"
      :active-file="activeFile"
      @select-file="activeFile = $event"
      @open-file="handleOpenFile"
      @open-sample="handleOpenSampleFile"
      @close-file="handleCloseFile"
      @toggle-reference="showReference = !showReference"
    />
    <main class="flex-1 flex min-w-0">
      <div class="flex-1 flex flex-col min-w-0">
        <router-view
          :active-file="activeFile"
          :open-files="openFiles"
          @toggle-tailing="handleToggleTailing"
          @open-reference="handleOpenReference"
        />
      </div>
      <ReferencePane v-if="showReference" ref="referencePaneRef" @close="showReference = false" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { getDefaultLogPath, readLogFile, startTailing, stopTailing, onTailUpdate } from "./lib/tauri-bridge";
import { parseLogFile, parseLogLines, parseChatLogTimezoneOffset } from "./lib/log-parser";
import type { OpenFile, FileKind } from "./lib/types";
import type { UnlistenFn } from "@tauri-apps/api/event";
import Sidebar from "./components/Sidebar.vue";
import ReferencePane from "./components/ReferencePane.vue";

const openFiles = ref<OpenFile[]>([]);
const activeFile = ref<string | null>(null);
const showReference = ref(false);
const referencePaneRef = ref<InstanceType<typeof ReferencePane> | null>(null);

async function handleOpenReference(name: string) {
  showReference.value = true;
  // Wait for the pane to mount if it wasn't open yet
  await nextTick();
  referencePaneRef.value?.scrollToEntry(name);
}
let unlistenTail: UnlistenFn | null = null;

onMounted(async () => {
  unlistenTail = await onTailUpdate((update) => {
    const file = openFiles.value.find((f) => f.path === update.path);
    if (!file || !file.tailing) return;
    const newLines = parseLogLines(update.content, file.path, file.lines.length + 1);
    file.lines.push(...newLines);
    file.rawContent += update.content;
  });

  // Auto-open default Player.log and start tailing
  const defaultPath = await getDefaultLogPath();
  if (defaultPath) {
    const content = await readLogFile(defaultPath);
    const fileName = defaultPath.split(/[\\/]/).pop() || defaultPath;
    const lines = parseLogFile(content, defaultPath);
    openFiles.value.push({
      path: defaultPath,
      name: fileName,
      kind: "log",
      lines,
      rawContent: content,
      tailing: true,
      timezoneOffsetMs: null,
    });
    activeFile.value = defaultPath;
    await startTailing(defaultPath);
  }
});

onUnmounted(() => {
  unlistenTail?.();
});

function detectFileKind(fileName: string): FileKind {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "json") return "json";
  if (ext === "log") return "log";
  return "text";
}

async function openFilePath(filePath: string) {
  if (openFiles.value.some((f) => f.path === filePath)) {
    activeFile.value = filePath;
    return;
  }

  const content = await readLogFile(filePath);
  const fileName = filePath.split(/[\\/]/).pop() || filePath;
  const kind = detectFileKind(fileName);
  const lines = kind === "json" ? [] : parseLogFile(content, filePath);

  const isChatLog = fileName.toLowerCase().startsWith("chat");
  const timezoneOffsetMs = isChatLog ? parseChatLogTimezoneOffset(content) : null;

  openFiles.value.push({
    path: filePath,
    name: fileName,
    kind,
    lines,
    rawContent: content,
    tailing: false,
    timezoneOffsetMs,
  });

  activeFile.value = filePath;
}

async function handleOpenFile() {
  const selected = await open({
    multiple: false,
    filters: [
      { name: "Log Files", extensions: ["log", "txt"] },
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!selected) return;
  await openFilePath(selected as string);
}

async function handleOpenSampleFile(path: string) {
  await openFilePath(path);
}

async function handleToggleTailing(path: string) {
  const file = openFiles.value.find((f) => f.path === path);
  if (!file) return;

  if (file.tailing) {
    await stopTailing(path);
    file.tailing = false;
  } else {
    await startTailing(path);
    file.tailing = true;
  }
}

async function handleCloseFile(path: string) {
  const file = openFiles.value.find((f) => f.path === path);
  if (file?.tailing) {
    await stopTailing(path);
  }
  const idx = openFiles.value.findIndex((f) => f.path === path);
  if (idx === -1) return;
  openFiles.value.splice(idx, 1);
  if (activeFile.value === path) {
    activeFile.value = openFiles.value[0]?.path ?? null;
  }
}
</script>
