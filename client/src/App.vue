<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import { useUiSettings } from "@/stores/useUiSettings";

const uiSettings = useUiSettings();

onMounted(() => {
  // v4.0: 初始化主题
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

// 🟢 根据主题计算根容器背景色（内联样式，确保优先级最高）
const themeBackgroundStyle = computed(() => {
  switch (uiSettings.theme) {
    case 'morning': return { backgroundColor: '#fafbfc' };
    case 'sunset': return { backgroundColor: '#2e1065' };
    case 'night': return { backgroundColor: '#0a0a0b' };
    default: return { backgroundColor: '#0a0a0b' };
  }
});
</script>

<template>
  <div 
    class="min-h-screen text-[var(--bubble-text)] transition-colors duration-500"
    :style="themeBackgroundStyle"
  >
    <AppLayout />
  </div>
</template>
