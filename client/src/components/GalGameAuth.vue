<template>
  <div class="gal-auth-split-screen">
    
    <!-- 🎨 左侧视觉区 (Visual Zone) -->
    <div class="visual-zone">
      
      <!-- 🌌 背景粒子系统 -->
      <TwilightParticles 
        :active="true" 
        theme="night" 
        :intensity="isConnecting ? 'burst' : 'active'" 
        :count="100" 
      />
      
      <!-- 🌟 网格背景 -->
      <div class="grid-overlay"></div>
      
      <!-- 💖 主Logo区域 -->
      <div class="logo-section">
        <div class="gal-logo-container">
          <div class="logo-heart">💖</div>
          <div class="logo-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>
        
        <div class="brand-text">
          <h1 class="gal-title">Gal❤Game</h1>
          <p class="gal-subtitle">{{ i18n.t('login.subtitle') }}</p>
          <div class="version-info">
            <span>Neural Link v11.0.4</span>
            <span class="protocol-status">Protocol: {{ isConnecting ? 'SYNCING' : 'SECURE' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 🌌 底部版权 -->
      <div class="copyright">
        COPYRIGHT © 2026 GAL❤GAME PROJECT. ALL RIGHTS RESERVED.
      </div>
      
    </div>
    
    <!-- 🖥️ 右侧终端区 (Terminal Zone) -->
    <div class="terminal-zone">
      
      <!-- 🌐 语言切换按钮 -->
      <button @click="toggleLanguage" class="lang-toggle-top">
        <Globe class="w-4 h-4" />
        <span>{{ i18n.t('actions.switchLanguage') }}</span>
      </button>
      
      <!-- 📺 终端内容 -->
      <div class="terminal-content">
        
        <!-- 🎯 标题区 -->
        <div class="terminal-header">
          <h2 class="terminal-title">
            {{ isRegisterMode ? i18n.t('login.initializeNeuralId') : i18n.t('login.neuralLink') }}
          </h2>
          <p class="terminal-subtitle">
            {{ isRegisterMode ? 'Initialize New Neural Protocol.' : 'Identify Yourself, Commander.' }}
          </p>
        </div>
        
        <!-- 🌐 第三方登录区域 -->
        <div class="oauth-section">
          <button 
            @click="handleSocialLogin('github')"
            class="oauth-btn github-btn"
            :disabled="isConnecting"
          >
            <Github class="w-5 h-5" />
            <span>Connect via GitHub</span>
          </button>
          
          <div class="oauth-grid">
            <button 
              @click="handleSocialLogin('qq')"
              class="oauth-btn qq-btn"
              :disabled="isConnecting"
            >
              <span class="font-bold">QQ</span>
              <span class="text-sm">{{ i18n.locale === 'zh' ? '连接' : 'Link' }}</span>
            </button>
            <button 
              @click="handleSocialLogin('wechat')"
              class="oauth-btn wechat-btn"
              :disabled="isConnecting"
            >
              <MessageCircle class="w-5 h-5" />
              <span class="text-sm">{{ i18n.locale === 'zh' ? '微信' : 'WeChat' }}</span>
            </button>
          </div>
        </div>
        
        <!-- 🔄 分隔线 -->
        <div class="divider">
          <div class="divider-line"></div>
          <span class="divider-text">{{ i18n.locale === 'zh' ? '或使用手动输入' : 'Or use manual input' }}</span>
          <div class="divider-line"></div>
        </div>
        
        <!-- 📝 手动输入表单 -->
        <form class="manual-form" @submit.prevent="handleManualLogin">
          
          <!-- 📧 用户名/邮箱 -->
          <div class="input-group">
            <label class="input-label">
              {{ i18n.locale === 'zh' ? '神经ID / 邮箱' : 'NEURAL ID / EMAIL' }}
            </label>
            <div class="input-wrapper">
              <Mail class="input-icon" />
              <input 
                v-model="formData.username"
                type="text"
                :placeholder="i18n.locale === 'zh' ? 'commander@sdp.link' : 'commander@galgame.link'"
                class="gal-input"
                :disabled="isConnecting"
              />
              <div class="input-glow"></div>
            </div>
          </div>
          
          <!-- 🔐 密码 -->
          <div class="input-group">
            <label class="input-label">
              {{ i18n.locale === 'zh' ? '访问密钥' : 'ACCESS CODE' }}
            </label>
            <div class="input-wrapper">
              <Lock class="input-icon" />
              <input 
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                class="gal-input"
                :disabled="isConnecting"
              />
              <div class="input-glow"></div>
            </div>
          </div>
          
          <!-- 📱 手机号（注册模式） -->
          <Transition name="slide-down">
            <div v-if="isRegisterMode" class="input-group">
              <label class="input-label">
                {{ i18n.t('login.emergencyContact') }}
              </label>
              <div class="input-wrapper">
                <Phone class="input-icon" />
                <input 
                  v-model="formData.phone"
                  type="tel"
                  :placeholder="i18n.locale === 'zh' ? '+86 1234567890' : '+1 234 567 8900'"
                  class="gal-input"
                  :disabled="isConnecting"
                />
                <div class="input-glow"></div>
              </div>
            </div>
          </Transition>
          
          <!-- 🛡️ 验证码区域 -->
          <div class="captcha-group">
            <div class="captcha-display" @click="refreshCaptcha">
              <div v-if="captchaLoading" class="captcha-loading">
                <Loader2 class="w-6 h-6 animate-spin text-pink-400" />
              </div>
              <img v-else-if="authStore.captchaImage" 
                   :src="authStore.captchaImage" 
                   alt="Security Code"
                   class="captcha-image"
              />
              <div v-else class="captcha-placeholder">
                <Shield class="w-8 h-8" />
                <span>{{ i18n.t('login.refreshCaptcha') }}</span>
              </div>
            </div>
            
            <div class="input-wrapper captcha-input">
              <Shield class="input-icon" />
              <input 
                v-model="formData.captcha"
                type="text"
                :placeholder="i18n.t('login.securityCode')"
                class="gal-input"
                :disabled="isConnecting"
                maxlength="4"
              />
              <div class="input-glow"></div>
            </div>
          </div>
          
          <!-- 🚀 主要操作按钮 -->
          <button 
            type="submit"
            :disabled="!canSubmit"
            class="main-action-btn"
            :class="{ 'connecting': isConnecting }"
          >
            <div class="btn-bg"></div>
            <div class="btn-content">
              <component :is="isConnecting ? Loader2 : Zap" 
                        :class="{ 'animate-spin': isConnecting }" 
                        class="w-5 h-5" 
              />
              <span>{{ isRegisterMode ? i18n.t('login.initializeId') : i18n.t('login.linkStart') }}</span>
            </div>
            <div class="btn-sparkles">
              <div class="sparkle sparkle-1"></div>
              <div class="sparkle sparkle-2"></div>
              <div class="sparkle sparkle-3"></div>
            </div>
          </button>
          
        </form>
        
        <!-- 🔄 模式切换 -->
        <div class="mode-switch">
          <span class="switch-hint">
            {{ isRegisterMode ? 
              (i18n.locale === 'zh' ? '已有指挥官账号?' : 'Already linked?') : 
              (i18n.locale === 'zh' ? '没有档案?' : "Don't have an archive?")
            }}
          </span>
          <button @click="isRegisterMode = !isRegisterMode" class="switch-btn">
            {{ isRegisterMode ? i18n.t('login.switchToLogin') : i18n.t('login.switchToRegister') }}
          </button>
        </div>
        
        <!-- ❌ 错误提示 -->
        <Transition name="error-bounce">
          <div v-if="hasError" class="error-panel">
            <AlertTriangle class="w-5 h-5" />
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>
        
      </div>
      
      <!-- 🎭 游客模式入口 -->
      <div class="guest-entry">
        <button class="guest-btn" @click="enterGuestMode">
          <Gamepad2 class="w-4 h-4" />
          <span>{{ i18n.t('login.guestMode') }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
      
    </div>
    
    <!-- ✨ 连接特效覆盖层 -->
    <div v-if="isConnecting" class="connection-effects">
      <div class="energy-pulse"></div>
      <div class="data-flow data-flow-1"></div>
      <div class="data-flow data-flow-2"></div>
      <div class="sync-rings">
        <div class="sync-ring ring-a"></div>
        <div class="sync-ring ring-b"></div>
        <div class="sync-ring ring-c"></div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import TwilightParticles from '@/components/TwilightParticles.vue'
import { I18n } from '@/locales'
import { 
  Zap, Mail, Lock, Phone, Shield, Loader2, AlertTriangle,
  Github, MessageCircle, Globe, Gamepad2, ArrowRight
} from 'lucide-vue-next'

/**
 * 🎮 Gal❤Game 分屏登录界面
 * 左侧视觉区 + 右侧终端区的二次元设计
 */

const authStore = useAuthStore()
const i18n = I18n.getInstance()

// 🔗 认证模式
const isRegisterMode = ref(false)

// 📝 表单数据
const formData = reactive({
  username: '',
  password: '',
  phone: '',
  captcha: ''
})

// 🛡️ 验证码状态
const captchaLoading = ref(false)

// 🔗 连接状态
const isConnecting = computed(() => authStore.isLinking)

// 🚫 错误状态
const hasError = computed(() => !!authStore.lastError)
const errorMessage = computed(() => {
  if (!authStore.lastError) return ''
  
  // 尝试翻译错误信息
  const errorTranslations: Record<string, string> = {
    'neural_sync_failed': i18n.t('errors.neuralSyncFailed'),
    'user_not_found': i18n.t('errors.userNotFound'),
    'captcha_invalid': i18n.t('errors.captchaInvalid'),
    'captcha_expired': i18n.t('errors.captchaExpired'),
    'validation_error': i18n.t('errors.validationError'),
    'connection_failed': i18n.t('errors.connectionFailed')
  }
  
  // 查找匹配的错误类型
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (authStore.lastError?.toLowerCase().includes(key)) {
      return translation
    }
  }
  
  return authStore.lastError
})

// 🔒 验证表单完整性
const canSubmit = computed(() => {
  return formData.username.trim() && 
         formData.password.trim() && 
         formData.captcha.trim() &&
         !isConnecting.value
})

// 🌐 语言切换
const toggleLanguage = () => {
  i18n.toggle()
}

// 🔄 刷新验证码
const refreshCaptcha = async () => {
  if (captchaLoading.value) return
  
  captchaLoading.value = true
  try {
    await authStore.getCaptcha()
  } catch (error) {
    console.warn('Failed to load captcha:', error)
  } finally {
    captchaLoading.value = false
  }
}

// 🌐 第三方登录
const handleSocialLogin = (provider: string) => {
  if (isConnecting.value) return
  
  // 跳转到后端 OAuth 接口
  const backendUrl = 'http://127.0.0.1:8002' // TODO: 从环境变量获取
  window.location.href = `${backendUrl}/api/auth/login/${provider}`
}

// 📝 手动登录
const handleManualLogin = async () => {
  if (!canSubmit.value) return
  
  try {
    if (isRegisterMode.value) {
      await authStore.register(
        formData.username, 
        formData.password, 
        formData.captcha,
        formData.phone || undefined
      )
    } else {
      await authStore.linkStart(
        formData.username, 
        formData.password, 
        formData.captcha
      )
    }
  } catch (error) {
    console.warn('Login failed:', error)
    // 重新获取验证码
    setTimeout(() => {
      refreshCaptcha()
      formData.captcha = ''
    }, 1000)
  }
}

// 🎭 进入游客模式
const enterGuestMode = () => {
  // TODO: 实现游客模式逻辑
  console.log('进入游客模式')
}

onMounted(() => {
  // 自动获取验证码
  setTimeout(() => {
    refreshCaptcha()
  }, 500)
})
</script>

<style scoped>
/* 🎨 分屏主容器 */
.gal-auth-split-screen {
  display: flex;
  min-height: 100vh;
  background: #020617;
  color: #f1f5f9;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

/* 🎨 左侧视觉区 (55%) */
.visual-zone {
  position: relative;
  width: 55%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
  overflow: hidden;
}

@media (max-width: 1024px) {
  .visual-zone {
    display: none;
  }
}

/* 🌟 网格背景 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 192, 203, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 192, 203, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 70%, transparent 100%);
  animation: gridShift 30s linear infinite;
}

@keyframes gridShift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}

/* 💖 Logo区域 */
.logo-section {
  position: relative;
  z-index: 10;
  text-align: center;
  animation: fadeInUp 1.5s ease-out;
}

.gal-logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
  transform: scale(1.2);
  transition: transform 0.7s ease;
}

.gal-logo-container:hover {
  transform: scale(1.25);
}

.logo-heart {
  font-size: 6rem;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 40px rgba(255, 182, 193, 1));
  animation: heartPulse 3s ease-in-out infinite;
}

@keyframes heartPulse {
  0%, 100% { 
    transform: scale(1); 
    filter: drop-shadow(0 0 40px rgba(255, 182, 193, 0.8));
  }
  50% { 
    transform: scale(1.1); 
    filter: drop-shadow(0 0 60px rgba(255, 182, 193, 1));
  }
}

.logo-rings {
  position: absolute;
  inset: -40px;
}

.ring {
  position: absolute;
  border: 2px solid rgba(255, 182, 193, 0.4);
  border-radius: 50%;
  animation: ringRotate 20s linear infinite;
}

.ring-1 {
  inset: 30px;
  animation-duration: 15s;
}

.ring-2 {
  inset: 15px;
  animation-duration: 20s;
  animation-direction: reverse;
}

.ring-3 {
  inset: 0;
  animation-duration: 25s;
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 🎭 品牌文字 */
.brand-text {
  space-y: 0.5rem;
}

.gal-title {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: linear-gradient(45deg, #ff69b4, #ff1493, #ff69b4, #da70d6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Comic Sans MS', 'Marker Felt', cursive;
  text-shadow: 0 0 60px rgba(255, 105, 180, 0.6);
  margin-bottom: 1rem;
}

.gal-subtitle {
  color: rgba(255, 182, 193, 0.9);
  font-size: 1.2rem;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  font-weight: 300;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: rgba(255, 182, 193, 0.6);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.protocol-status {
  color: rgba(34, 197, 94, 0.8);
  font-weight: 500;
}

/* 🌌 版权信息 */
.copyright {
  position: absolute;
  bottom: 2rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

/* 🖥️ 右侧终端区 (45%) */
.terminal-zone {
  position: relative;
  width: 45%;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 182, 193, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .terminal-zone {
    width: 100%;
  }
}

/* 🌐 顶部语言切换 */
.lang-toggle-top {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(255, 182, 193, 0.1);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 10px;
  color: rgba(255, 182, 193, 0.9);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.lang-toggle-top:hover {
  background: rgba(255, 182, 193, 0.2);
  transform: scale(1.05);
}

/* 📺 终端内容 */
.terminal-content {
  flex: 1;
  padding: 4rem 3rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 28rem;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .terminal-content {
    padding: 3rem 2rem;
  }
}

/* 🎯 终端标题 */
.terminal-header {
  margin-bottom: 2.5rem;
  text-align: left;
}

.terminal-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

.terminal-subtitle {
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.8);
  line-height: 1.4;
}

/* 🌐 OAuth区域 */
.oauth-section {
  margin-bottom: 2rem;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.github-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  margin-bottom: 1rem;
}

.github-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.oauth-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.qq-btn {
  background: rgba(57, 164, 255, 0.1);
  border: 1px solid rgba(57, 164, 255, 0.2);
  color: rgb(57, 164, 255);
}

.qq-btn:hover:not(:disabled) {
  background: rgba(57, 164, 255, 0.2);
  transform: scale(1.05);
}

.wechat-btn {
  background: rgba(7, 193, 96, 0.1);
  border: 1px solid rgba(7, 193, 96, 0.2);
  color: rgb(7, 193, 96);
}

.wechat-btn:hover:not(:disabled) {
  background: rgba(7, 193, 96, 0.2);
  transform: scale(1.05);
}

/* 🔄 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: 2rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider-text {
  padding: 0 1rem;
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 📝 手动表单 */
.manual-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: rgba(148, 163, 184, 0.8);
  letter-spacing: 0.05em;
  margin-left: 0.25rem;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: rgba(148, 163, 184, 0.6);
  z-index: 2;
}

.gal-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-size: 0.9rem;
  color: rgba(226, 232, 240, 0.95);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.gal-input::placeholder {
  color: rgba(148, 163, 184, 0.5);
}

.gal-input:focus {
  outline: none;
  border-color: rgba(255, 182, 193, 0.5);
  box-shadow: 0 0 0 1px rgba(255, 182, 193, 0.2);
}

.input-glow {
  position: absolute;
  inset: -1px;
  background: linear-gradient(45deg, rgba(255, 182, 193, 0.3), rgba(255, 105, 180, 0.2));
  border-radius: 0.75rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
  filter: blur(4px);
}

.gal-input:focus + .input-glow {
  opacity: 1;
}

/* 🛡️ 验证码组 */
.captcha-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.captcha-display {
  flex-shrink: 0;
  width: 7.5rem;
  height: 3.125rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.captcha-display:hover {
  border-color: rgba(255, 182, 193, 0.4);
  box-shadow: 0 0 20px rgba(255, 182, 193, 0.2);
}

.captcha-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.375rem;
}

.captcha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 182, 193, 0.6);
  font-size: 0.7rem;
  text-align: center;
}

.captcha-loading {
  color: rgba(255, 182, 193, 0.8);
}

.captcha-input {
  flex: 1;
}

/* 🚀 主操作按钮 */
.main-action-btn {
  position: relative;
  width: 100%;
  background: linear-gradient(45deg, rgb(34, 197, 94), rgb(59, 130, 246));
  border: none;
  border-radius: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.3);
  margin: 1rem 0;
}

.main-action-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, rgb(22, 163, 74), rgb(37, 99, 235));
  transform: translateY(-1px);
  box-shadow: 0 20px 40px -10px rgba(34, 197, 94, 0.4);
}

.main-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-action-btn.connecting {
  background: linear-gradient(45deg, rgb(245, 158, 11), rgb(249, 115, 22));
  animation: connectingPulse 2s ease-in-out infinite;
}

@keyframes connectingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.btn-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.main-action-btn:hover .btn-bg {
  transform: translateX(100%);
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: sparkleFloat 3s ease-in-out infinite;
}

.sparkle-1 {
  top: 25%;
  left: 25%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 60%;
  right: 30%;
  animation-delay: 1s;
}

.sparkle-3 {
  bottom: 30%;
  left: 70%;
  animation-delay: 2s;
}

@keyframes sparkleFloat {
  0%, 100% { opacity: 0; transform: scale(0) translateY(0); }
  50% { opacity: 1; transform: scale(1) translateY(-8px); }
}

/* 🔄 模式切换 */
.mode-switch {
  text-align: center;
  margin: 1rem 0;
}

.switch-hint {
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.8rem;
}

.switch-btn {
  color: rgba(255, 182, 193, 0.9);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 0.8rem;
}

.switch-btn:hover {
  color: rgb(255, 105, 180);
  text-decoration: underline;
}

/* ❌ 错误面板 */
.error-panel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: rgba(248, 113, 113, 0.95);
  font-size: 0.85rem;
  margin-top: 1rem;
}

/* 🎭 游客入口 */
.guest-entry {
  padding: 1.5rem 3rem 2rem 3rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
  .guest-entry {
    padding: 1.5rem 2rem;
  }
}

.guest-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 182, 193, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 182, 193, 0.8);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guest-btn:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(255, 182, 193, 0.4);
  color: rgb(255, 182, 193);
  transform: translateY(-1px);
}

/* ✨ 连接特效覆盖层 */
.connection-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.energy-pulse {
  position: absolute;
  width: 15rem;
  height: 15rem;
  border: 3px solid rgba(255, 182, 193, 0.6);
  border-radius: 50%;
  animation: pulseExpand 2.5s ease-out infinite;
}

@keyframes pulseExpand {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.data-flow {
  position: absolute;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, 
    transparent 0%,
    rgba(255, 182, 193, 0.8) 30%,
    rgba(255, 182, 193, 1) 50%,
    rgba(255, 182, 193, 0.8) 70%,
    transparent 100%
  );
  animation: flowDown 2s ease-in-out infinite;
}

.data-flow-1 {
  left: 25%;
  animation-delay: 0s;
}

.data-flow-2 {
  right: 25%;
  animation-delay: 1s;
}

@keyframes flowDown {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.sync-rings {
  position: absolute;
  width: 20rem;
  height: 20rem;
}

.sync-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: rgba(255, 182, 193, 0.8);
  border-radius: 50%;
  animation: ringSpin 1.5s linear infinite;
}

.ring-a {
  animation-duration: 1.2s;
}

.ring-b {
  inset: 1rem;
  animation-duration: 1.8s;
  animation-direction: reverse;
}

.ring-c {
  inset: 2rem;
  animation-duration: 2.4s;
}

@keyframes ringSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 🎬 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
  max-height: 0;
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
  max-height: 0;
}

.error-bounce-enter-active,
.error-bounce-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.error-bounce-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-0.5rem);
}

.error-bounce-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-0.5rem);
}

@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(2rem); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* 📱 响应式设计 */
@media (max-width: 768px) {
  .gal-auth-split-screen {
    flex-direction: column;
  }
  
  .visual-zone,
  .terminal-zone {
    width: 100%;
  }
  
  .visual-zone {
    min-height: 40vh;
    display: flex;
  }
  
  .gal-title {
    font-size: 3rem;
  }
  
  .captcha-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .captcha-display {
    width: 100%;
    height: 3.75rem;
  }
}

@media (max-width: 480px) {
  .oauth-grid {
    grid-template-columns: 1fr;
  }
  
  .gal-title {
    font-size: 2.5rem;
  }
  
  .terminal-content {
    padding: 2rem 1.5rem;
  }
}
</style>