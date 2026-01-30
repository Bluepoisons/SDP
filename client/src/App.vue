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

// 🟢 根据主题计算根容器背景类（强制覆盖，不依赖 CSS 层叠）
const themeBackgroundClass = computed(() => {
  switch (uiSettings.theme) {
    case 'morning': return 'bg-[#fafbfc]'; // 强制亮色背景
    case 'sunset': return 'bg-[#2e1065]';  // 强制深紫背景
    case 'night': return 'bg-[#0a0a0b]';   // 强制深黑背景
    default: return 'bg-[#0a0a0b]';
  }
});
</script>

<template>
  <div 
    class="min-h-screen text-[var(--bubble-text)] transition-colors duration-500"
    :class="themeBackgroundClass"
  >
    <AppLayout />
  </div>
</template>
