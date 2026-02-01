<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import NeuralLinkLogin from "@/components/NeuralLinkLogin.vue";
import { useUiSettings } from "@/stores/useUiSettings";
import { useAuthStore } from "@/stores/useAuthStore";

const uiSettings = useUiSettings();
const authStore = useAuthStore();

// 🧠 是否显示主应用（已认证）
const showMainApp = computed(() => authStore.isAuthenticated);

onMounted(async () => {
  // v2.0: 初始化主题
  uiSettings.initTheme();
  
  // 视效开关
  document.body.classList.toggle("fx-anim-on", uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-anim-off", !uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-blur-on", uiSettings.blurEnabled);
  document.body.classList.toggle("fx-blur-off", !uiSettings.blurEnabled);
  document.body.classList.toggle("fx-shadow-on", uiSettings.shadowEnabled);
  document.body.classList.toggle("fx-shadow-off", !uiSettings.shadowEnabled);
  
  // 🧠 检查神经连接会话
  await authStore.checkSession();
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
  <!-- 🧠 Neural Link v11.0: 神经连接守卫 -->
  <div class="min-h-screen" style="color: var(--theme-text);">
    <!-- 🔐 神经连接界面 -->
    <Transition name="neural-fade" mode="out-in">
      <NeuralLinkLogin v-if="!showMainApp" />
      <AppLayout v-else />
    </Transition>
  </div>
</template>

<style scoped>
.neural-fade-enter-active,
.neural-fade-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.neural-fade-enter-from {
  opacity: 0;
  transform: scale(1.05) rotateX(5deg);
  filter: blur(20px);
}

.neural-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) rotateX(-5deg);
  filter: blur(20px);
}

/* 🧠 Neural Link 特效 */
.neural-fade-enter-active::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, 
    rgba(0, 255, 255, 0.1) 0%,
    rgba(0, 150, 255, 0.05) 30%,
    transparent 70%
  );
  animation: neuralPulse 0.8s ease-out;
  pointer-events: none;
  z-index: 9999;
}

@keyframes neuralPulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}
</style>
