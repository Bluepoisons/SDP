<script setup lang="ts">
import { onMounted, watch } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import { useUiSettings } from "@/stores/useUiSettings";

const uiSettings = useUiSettings();

onMounted(() => {
  // v2.0: 初始化主题
  uiSettings.initTheme();
  
  // 视效开关
  document.body.classList.toggle("fx-anim-on", uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-anim-off", !uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-blur-on", uiSettings.blurEnabled);
  document.body.classList.toggle("fx-blur-off", !uiSettings.blurEnabled);
  document.body.classList.toggle("fx-shadow-on", uiSettings.shadowEnabled);
  document.body.classList.toggle("fx-shadow-off", !uiSettings.shadowEnabled);
});

watch(
  () => [uiSettings.animationsEnabled, uiSettings.blurEnabled, uiSettings.shadowEnabled],
  ([anim, blur, shadow]) => {
    document.body.classList.toggle("fx-anim-on", anim);
    document.body.classList.toggle("fx-anim-off", !anim);
    document.body.classList.toggle("fx-blur-on", blur);
    document.body.classList.toggle("fx-blur-off", !blur);
    document.body.classList.toggle("fx-shadow-on", shadow);
    document.body.classList.toggle("fx-shadow-off", !shadow);
  },
  { immediate: true }
);
</script>

<template>
  <!-- 🆕 v2.0: 不设置任何背景，完全依赖 body 的 CSS 变量 -->
  <div class="min-h-screen" style="color: var(--theme-text);">
    <AppLayout />
  </div>
</template>
