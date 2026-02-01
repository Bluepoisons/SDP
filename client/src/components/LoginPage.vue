<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Zap, User, KeyRound, Sparkles, ChevronRight, Globe, Lock, Mail, RefreshCw, Shield } from 'lucide-vue-next';
import TwilightParticles from '@/components/TwilightParticles.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/input/Input.vue';
import { useI18n } from '@/composables/useI18n';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * 🎮 Link Start - 二游风格登录界面 v11.0
 * 灵感来源: SAO、原神、崩铁的开场画面
 * 功能: 首页Logo + 登录 + 注册 + 验证码 + i18n
 */

const emit = defineEmits<{
  login: [username: string];
}>();

// 🌐 国际化
const { t, locale, toggleLocale, isZh } = useI18n();

// 🔐 认证状态
const authStore = useAuthStore();

// 🎬 场景状态
type Scene = 'title' | 'auth';
const currentScene = ref<Scene>('title');
const isTransitioning = ref(false);

// 📝 表单数据
const username = ref('');
const password = ref('');
const captchaInput = ref('');
const emergencyContact = ref('');
const isNewUser = ref(false);
const errorMessage = ref('');

// 🛡️ 验证码状态
const captchaLoading = ref(false);

// 🌟 Loading 状态
const isLinking = ref(false);
const linkProgress = ref(0);
const linkStagesZh = [
  '初始化神经接口',
  '同步意识数据',
  '验证身份标识',
  '建立量子通道',
  '神经链接完成'
];
const linkStagesEn = [
  'Initializing Neural Interface',
  'Synchronizing Consciousness',
  'Verifying Identity',
  'Establishing Quantum Channel',
  'Neural Link Complete'
];
const currentStage = ref(0);

// 计算当前语言的链接阶段文本
const linkStages = computed(() => isZh.value ? linkStagesZh : linkStagesEn);

// 💫 闪烁文字
const showCursor = ref(true);

// ⌨️ 按键监听
const handleKeyPress = (e: KeyboardEvent) => {
  if (currentScene.value === 'title' && !isTransitioning.value) {
    transitionToAuth();
  }
};

const handleClick = () => {
  if (currentScene.value === 'title' && !isTransitioning.value) {
    transitionToAuth();
  }
};

// 🎬 场景切换动画
const transitionToAuth = () => {
  isTransitioning.value = true;
  
  setTimeout(() => {
    currentScene.value = 'auth';
    isTransitioning.value = false;
    // 自动获取验证码
    refreshCaptcha();
  }, 800);
};

// 🔄 刷新验证码
const refreshCaptcha = async () => {
  if (captchaLoading.value) return;
  
  captchaLoading.value = true;
  errorMessage.value = '';
  captchaInput.value = '';
  
  try {
    await authStore.getCaptcha();
  } catch (error: any) {
    console.error('Failed to load captcha:', error);
    errorMessage.value = t('errors.connectionFailed');
  } finally {
    captchaLoading.value = false;
  }
};

// 🚀 执行登录/注册
const executeLink = async () => {
  if (!username.value.trim() || isLinking.value) return;
  if (!captchaInput.value.trim()) {
    errorMessage.value = t('errors.captchaInvalid');
    return;
  }
  
  isLinking.value = true;
  linkProgress.value = 0;
  currentStage.value = 0;
  errorMessage.value = '';
  
  try {
    // 模拟初始化过程动画
    for (let i = 0; i < linkStages.value.length - 1; i++) {
      currentStage.value = i;
      linkProgress.value = ((i + 1) / linkStages.value.length) * 100;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 实际认证请求
    if (isNewUser.value) {
      // 注册
      await authStore.register(
        username.value.trim(),
        password.value || 'default_password',
        captchaInput.value.trim(),
        emergencyContact.value.trim() || undefined
      );
    } else {
      // 登录
      await authStore.linkStart(
        username.value.trim(),
        password.value || 'default_password',
        captchaInput.value.trim()
      );
    }
    
    // 最后阶段
    currentStage.value = linkStages.value.length - 1;
    linkProgress.value = 100;
    
    // 完成后发射事件
    setTimeout(() => {
      emit('login', username.value.trim());
    }, 500);
    
  } catch (error: any) {
    errorMessage.value = error.message || t('errors.neuralSyncFailed');
    // 刷新验证码
    await refreshCaptcha();
    isLinking.value = false;
  }
};

// 🎯 表单验证
const isReady = computed(() => 
  username.value.trim().length >= 2 && 
  captchaInput.value.trim().length >= 4
);

// 🎭 光标闪烁
let cursorInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
  
  cursorInterval = setInterval(() => {
    showCursor.value = !showCursor.value;
  }, 530);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  clearInterval(cursorInterval);
});
</script>

<template>
  <div class="login-page" @click="handleClick">
    <!-- 🌌 背景粒子 -->
    <TwilightParticles class="absolute inset-0" />
    
    <!-- 🌐 语言切换按钮 (始终显示) -->
    <button class="language-toggle" @click.stop="toggleLocale">
      <Globe class="w-4 h-4" />
      <span>{{ isZh ? 'EN' : '中' }}</span>
    </button>
    
    <!-- 🎬 标题场景 -->
    <Transition name="scene-fade">
      <div v-if="currentScene === 'title'" class="title-scene">
        <!-- Logo 区域 -->
        <div class="logo-area" :class="{ 'logo-transitioning': isTransitioning }">
          <!-- 主 Logo -->
          <div class="main-logo">
            <img src="/images/avatar.png" alt="Gal Logo" class="logo-image" />
          </div>
          
          <!-- 副标题 -->
          <p class="logo-subtitle">
            <span class="subtitle-deco">—</span>
            NEURAL DIALOGUE SYSTEM
            <span class="subtitle-deco">—</span>
          </p>
          
          <!-- 版本号 -->
          <p class="version-tag">ver.11.0 「Neural Link」</p>
        </div>
        
        <!-- 按键提示 -->
        <div class="press-key-hint" :class="{ 'hint-fading': isTransitioning }">
          <span class="hint-bracket">[</span>
          <span class="hint-text">{{ t('login.pressAnyKey') }}</span>
          <span class="hint-cursor" :class="{ 'cursor-visible': showCursor }">_</span>
          <span class="hint-bracket">]</span>
        </div>
        
        <!-- 底部装饰 -->
        <div class="bottom-deco">
          <div class="deco-line"></div>
          <span class="deco-text">{{ t('login.copyright') }}</span>
          <div class="deco-line"></div>
        </div>
      </div>
    </Transition>
    
    <!-- 🔐 认证场景 -->
    <Transition name="scene-slide">
      <div v-if="currentScene === 'auth'" class="auth-scene">
        <!-- 迷你 Logo -->
        <div class="mini-logo">
          <img src="/images/avatar.png" alt="Gal Logo" class="logo-image-mini" />
        </div>
        
        <!-- 认证卡片 -->
        <div class="auth-card glass-panel">
          <!-- 扫描线效果 -->
          <div class="scan-line"></div>
          
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-icon">
              <Sparkles class="w-6 h-6" />
            </div>
            <div class="header-text">
              <h2 class="title-happy">{{ isNewUser ? t('login.createArchive') : t('login.neuralLink') }}</h2>
              <p class="header-subtitle">{{ isNewUser ? 'Register Protocol' : 'Link Start' }}</p>
            </div>
          </div>
          
          <!-- 错误消息 -->
          <div v-if="errorMessage" class="error-message">
            <span class="error-icon">⚠</span>
            <span>{{ errorMessage }}</span>
          </div>
          
          <!-- 表单区域 -->
          <div class="card-body">
            <!-- 用户名输入 -->
            <div class="input-group">
              <label class="input-label">
                <User class="w-4 h-4" />
                <span>{{ t('login.identifier') }} / Codename</span>
              </label>
              <div class="input-wrapper" :class="{ 'input-focused': username }">
                <Input
                  v-model="username"
                  :placeholder="t('login.identifierPlaceholder')"
                  class="auth-input"
                  :disabled="isLinking"
                  @keydown.enter="executeLink"
                />
                <div class="input-glow"></div>
              </div>
            </div>
            
            <!-- 密码输入 (仅在需要时显示) -->
            <div class="input-group">
              <label class="input-label">
                <Lock class="w-4 h-4" />
                <span>{{ t('login.password') }} / Neural Key</span>
              </label>
              <div class="input-wrapper" :class="{ 'input-focused': password }">
                <Input
                  v-model="password"
                  type="password"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="auth-input"
                  :disabled="isLinking"
                  @keydown.enter="executeLink"
                />
                <div class="input-glow"></div>
              </div>
            </div>
            
            <!-- 紧急联络 (注册时显示) -->
            <div v-if="isNewUser" class="input-group">
              <label class="input-label">
                <Mail class="w-4 h-4" />
                <span>{{ t('login.emergencyContact') }}</span>
              </label>
              <div class="input-wrapper" :class="{ 'input-focused': emergencyContact }">
                <Input
                  v-model="emergencyContact"
                  :placeholder="t('login.emergencyContactPlaceholder')"
                  class="auth-input"
                  :disabled="isLinking"
                />
                <div class="input-glow"></div>
              </div>
            </div>
            
            <!-- 🛡️ 验证码输入 -->
            <div class="input-group">
              <label class="input-label">
                <Shield class="w-4 h-4" />
                <span>{{ t('login.securityCode') }}</span>
              </label>
              <div class="captcha-row">
                <div class="input-wrapper captcha-input-wrapper" :class="{ 'input-focused': captchaInput }">
                  <Input
                    v-model="captchaInput"
                    :placeholder="t('login.securityCodePlaceholder')"
                    class="auth-input"
                    :disabled="isLinking"
                    maxlength="4"
                    @keydown.enter="executeLink"
                  />
                  <div class="input-glow"></div>
                </div>
                <div class="captcha-image-box" @click.stop="refreshCaptcha">
                  <template v-if="captchaLoading">
                    <RefreshCw class="w-5 h-5 animate-spin" />
                    <span class="captcha-loading-text">{{ t('status.loadingCaptcha') }}</span>
                  </template>
                  <template v-else-if="authStore.captchaImage">
                    <img 
                      :src="authStore.captchaImage" 
                      alt="captcha" 
                      class="captcha-image"
                    />
                    <span class="captcha-refresh-hint">{{ t('login.refreshCaptcha') }}</span>
                  </template>
                  <template v-else>
                    <RefreshCw class="w-5 h-5" />
                    <span>{{ t('login.refreshCaptcha') }}</span>
                  </template>
                </div>
              </div>
            </div>
            
            <!-- 模式切换 -->
            <button 
              class="mode-switch"
              :disabled="isLinking"
              @click.stop="isNewUser = !isNewUser"
            >
              <span class="switch-text">
                {{ isNewUser ? t('login.switchToLogin') : t('login.switchToRegister') }}
              </span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          
          <!-- 登录按钮 -->
          <div class="card-footer">
            <button
              class="link-button"
              :class="{ 'is-linking': isLinking, 'is-ready': isReady && !isLinking }"
              :disabled="!isReady || isLinking"
              @click.stop="executeLink"
            >
              <template v-if="isLinking">
                <!-- 加载进度 -->
                <div class="link-progress">
                  <div class="progress-bar" :style="{ width: `${linkProgress}%` }"></div>
                </div>
                <span class="link-stage">{{ linkStages[currentStage] }}</span>
              </template>
              <template v-else>
                <Zap class="w-5 h-5" />
                <span>{{ t('login.linkStart') }}</span>
              </template>
            </button>
          </div>
        </div>
        
        <!-- 底部提示 -->
        <p class="auth-hint">
          {{ t('login.quote') }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg);
  overflow: hidden;
  cursor: default;
}

/* 🌐 语言切换按钮 */
.language-toggle {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text-secondary);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-toggle:hover {
  color: var(--theme-text);
  background: rgba(0, 0, 0, 0.6);
  border-color: var(--theme-accent);
  transform: scale(1.05);
}

/* ═══════════════════════════════════════════════════════════════════
   🎬 标题场景
   ═══════════════════════════════════════════════════════════════════ */
.title-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  z-index: 10;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-area.logo-transitioning {
  transform: scale(1.2) translateY(-30px);
  opacity: 0;
}

/* 主 Logo */
.main-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logo-breathe 4s ease-in-out infinite;
}

.main-logo .logo-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 0 30px var(--theme-glow)) drop-shadow(0 0 60px var(--theme-glow));
  border-radius: 20px;
}

@keyframes logo-breathe {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.02); filter: brightness(1.1); }
}

.logo-gal {
  background: linear-gradient(135deg, #a78bfa 0%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-heart {
  color: #f472b6;
  margin: 0 0.25rem;
  animation: heart-pulse 1.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes heart-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.logo-chat {
  background: linear-gradient(135deg, #22d3ee 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtitle {
  font-family: var(--font-cute);
  font-size: 0.875rem;
  letter-spacing: 0.3em;
  color: var(--theme-text-secondary);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.subtitle-deco {
  width: 2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
}

.version-tag {
  font-family: var(--font-cute);
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  letter-spacing: 0.1em;
}

/* 按键提示 */
.press-key-hint {
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 0.2em;
  color: var(--theme-text-secondary);
  display: flex;
  align-items: center;
  animation: hint-blink 2s ease-in-out infinite;
  transition: opacity 0.5s;
}

.press-key-hint.hint-fading {
  opacity: 0;
}

@keyframes hint-blink {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.hint-bracket {
  color: var(--theme-accent);
}

.hint-text {
  margin: 0 0.5rem;
}

.hint-cursor {
  opacity: 0;
  transition: opacity 0.1s;
}

.hint-cursor.cursor-visible {
  opacity: 1;
}

/* 底部装饰 */
.bottom-deco {
  position: absolute;
  bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--theme-text-muted);
  font-size: 0.75rem;
}

.deco-line {
  width: 4rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--theme-text-muted), transparent);
}

/* ═══════════════════════════════════════════════════════════════════
   🔐 认证场景
   ═══════════════════════════════════════════════════════════════════ */
.auth-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  z-index: 10;
  padding: 2rem;
}

.mini-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.mini-logo .logo-image-mini {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 0 15px var(--theme-accent));
  border-radius: 12px;
}

.mini-logo .logo-gal,
.mini-logo .logo-chat {
  background: linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mini-logo .logo-heart {
  color: #f472b6;
  font-size: 1.5rem;
  margin: 0 0.125rem;
}

/* 认证卡片 */
.auth-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

/* 扫描线 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
  animation: scan 3s linear infinite;
}

@keyframes scan {
  0% { top: 0; opacity: 1; }
  50% { opacity: 0.5; }
  100% { top: 100%; opacity: 0; }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-secondary) 100%);
  color: white;
}

.header-text h2 {
  font-size: 1.25rem;
  color: var(--theme-text);
  margin-bottom: 0.25rem;
}

.header-subtitle {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* 表单 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.input-wrapper {
  position: relative;
}

.auth-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: var(--theme-text);
  transition: all 0.3s;
}

.auth-input:focus {
  border-color: var(--theme-accent);
  box-shadow: 0 0 20px var(--theme-glow);
}

.input-glow {
  position: absolute;
  inset: -1px;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--theme-accent), var(--theme-accent-secondary));
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s;
}

.input-wrapper.input-focused .input-glow {
  opacity: 0.3;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

/* 模式切换 */
.mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
}

.mode-switch:hover {
  color: var(--theme-accent);
}

/* 登录按钮 */
.card-footer {
  margin-top: 1.5rem;
}

.link-button {
  position: relative;
  width: 100%;
  padding: 1rem 2rem;
  font-family: var(--font-happy);
  font-size: 1.125rem;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: not-allowed;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.link-button.is-ready {
  color: white;
  background: linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-secondary) 100%);
  border-color: transparent;
  cursor: pointer;
  box-shadow: 0 0 30px var(--theme-glow);
}

.link-button.is-ready:hover {
  transform: scale(1.02);
  box-shadow: 0 0 40px var(--theme-glow);
}

.link-button.is-linking {
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.8);
  border-color: var(--theme-accent);
  cursor: wait;
}

/* 进度条 */
.link-progress {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-accent), var(--theme-accent-secondary));
  border-radius: 2px;
  transition: width 0.3s ease-out;
}

.link-stage {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--theme-accent);
  letter-spacing: 0.1em;
}

/* 底部提示 */
.auth-hint {
  font-family: var(--font-cute);
  font-size: 0.875rem;
  color: var(--theme-text-muted);
  text-align: center;
  font-style: italic;
}

/* ═══════════════════════════════════════════════════════════════════
   🎭 场景过渡动画
   ═══════════════════════════════════════════════════════════════════ */
.scene-fade-enter-active,
.scene-fade-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.scene-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scene-fade-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.scene-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.3s;
}

.scene-slide-leave-active {
  transition: all 0.4s ease-out;
}

.scene-slide-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.95);
}

.scene-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 🚫 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.error-icon {
  font-size: 1rem;
}

/* 🛡️ 验证码行 */
.captcha-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.captcha-input-wrapper {
  flex: 1;
}

.captcha-image-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 120px;
  height: auto;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.captcha-image-box:hover {
  border-color: var(--theme-accent);
  background: rgba(0, 0, 0, 0.6);
}

.captcha-image {
  width: 100%;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
}

.captcha-loading-text,
.captcha-refresh-hint {
  font-size: 0.625rem;
  color: var(--theme-text-muted);
  text-align: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
