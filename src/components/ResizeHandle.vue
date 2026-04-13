<template>
  <div
    class="w-1 cursor-col-resize bg-border hover:bg-accent/50 active:bg-accent transition-colors shrink-0"
    @mousedown="onMouseDown"
  ></div>
</template>

<script setup lang="ts">
import { onUnmounted } from "vue";

const emit = defineEmits<{
  resize: [deltaX: number];
}>();

let startX = 0;

function onMouseDown(e: MouseEvent) {
  startX = e.clientX;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onMouseMove(e: MouseEvent) {
  const delta = e.clientX - startX;
  startX = e.clientX;
  emit("resize", delta);
}

function onMouseUp() {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>
