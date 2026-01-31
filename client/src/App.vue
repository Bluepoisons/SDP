<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import LoginPage from "@/components/LoginPage.vue";
import { useUiSettings } from "@/stores/useUiSettings";
import { useAuthStore } from "@/stores/useAuthStore";

const uiSettings = useUiSettings();
const authStore = useAuthStore();

// 🎮 是否显示主应用（已登录）
const showMainApp = computed(() => authStore.isAuthenticated);

// 🚀 处理登录
const handleLogin = (username: string) => {
  authStore.linkStart(username);
};

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
  
  // 🔐 检查登录状态
  authStore.checkSession();
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
  <!-- 🆕 v10.0: 登录守卫 -->
  <div class="min-h-screen" style="color: var(--theme-text);">
    <!-- 🔐 登录页面 -->
    <Transition name="app-fade" mode="out-in">
      <LoginPage v-if="!showMainApp" @login="handleLogin" />
      <AppLayout v-else />
    </Transition>
  </div>
</template>

<style scoped>
.app-fade-enter-active,
.app-fade-leave-active {
  transition: all 0.5s ease;
}

.app-fade-enter-from {
  opacity: 0;
  transform: scale(1.02);
}

.app-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
