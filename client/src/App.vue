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

// 🔗 处理登录成功
const handleLogin = (username: string) => {
  console.log('🎮 Login successful:', username);
  // 登录逻辑已在 LoginPage 中通过 authStore 处理
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
  
  // 🔐 初始化认证状态（已在 useAuthStore 中自动执行）
  if (authStore.isAuthenticated) {
    console.log('🔗 Auth session restored:', authStore.user?.username);
  }
  
  // 🌐 检查 OAuth 回调 (简化版本，从 URL 参数检查)
  const urlParams = new URLSearchParams(window.location.search);
  const provider = urlParams.get('provider');
  if (provider && (urlParams.has('code') || urlParams.has('error'))) {
    handleOAuthCallback(provider, urlParams);
  }
});

// 🌐 处理 OAuth 回调
const handleOAuthCallback = async (provider: string, params: URLSearchParams) => {
  try {
    await authStore.handleOAuthCallback(provider, params);
    // 清理 URL 参数
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log(`🌐 OAuth ${provider} login successful`);
  } catch (error) {
    console.error(`OAuth ${provider} callback failed:`, error);
  }
};

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
  <!-- 🎮 Neural Link v11.0: 二游风格登录界面 -->
  <div class="min-h-screen" style="color: var(--theme-text);">
    <!-- 🔐 Link Start 登录界面 (带首页/验证码/i18n) -->
    <Transition name="neural-fade" mode="out-in">
      <LoginPage v-if="!showMainApp" @login="handleLogin" />
      <AppLayout v-else />
    </Transition>
  </div>
</template>

<style scoped>
.neural-fade-enter-active,
.neural-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.neural-fade-enter-from {
  opacity: 0;
  transform: scale(1.02) rotateY(10deg);
  filter: blur(8px);
}

.neural-fade-leave-to {
  opacity: 0;
  transform: scale(0.98) rotateY(-10deg);
  filter: blur(8px);
}
</style>
