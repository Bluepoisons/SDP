<template>
  <div class="neural-login-container">
    <!-- 🌌 背景粒子系统 -->
    <TwilightParticles :theme="'night'" :intensity="linkingMode ? 'burst' : 'active'" :count="80" />
    
    <!-- 🧠 主容器 -->
    <div class="neural-main-panel">
      
      <!-- 🎬 开场标题场景 -->
      <Transition name="neural-title" appear>
        <div v-if="currentScene === 'title'" class="title-scene" @click="enterLinkMode">
          <div class="neural-logo">
            <div class="logo-core">🧠</div>
            <div class="logo-rings">
              <div class="ring ring-1"></div>
              <div class="ring ring-2"></div>
              <div class="ring ring-3"></div>
            </div>
          </div>
          
          <h1 class="neural-title">NEURAL LINK</h1>
          <p class="neural-subtitle">v11.0 Identity System</p>
          
          <div class="start-prompt">
            <div class="prompt-text" :class="{ 'pulse': showCursor }">
              [ PRESS TO START NEURAL CONNECTION ]
            </div>
          </div>
        </div>
      </Transition>
      
      <!-- 🔗 神经连接界面 -->
      <Transition name="neural-link" appear>
        <div v-if="currentScene === 'link'" class="link-scene">
          
          <!-- 🎯 状态指示器 -->
          <div class="status-panel">
            <div class="status-indicator" :class="{ 'connecting': linkingMode, 'error': hasError }">
              <div class="indicator-core"></div>
            </div>
            <div class="status-text">
              {{ linkingMode ? linkingStage : (hasError ? errorMessage : 'Neural Link Ready') }}
            </div>
            <div class="sync-rate">Sync Rate: {{ syncRate }}%</div>
          </div>
          
          <!-- 🧠 认证表单 -->
          <div class="auth-form" :class="{ 'disabled': linkingMode }">
            
            <!-- 🔐 模式切换 -->
            <div class="auth-mode-toggle">
              <button 
                @click="isRegisterMode = false"
                :class="{ 'active': !isRegisterMode }"
                class="mode-btn"
              >
                <KeyRound class="w-4 h-4" />
                Neural Link
              </button>
              <button 
                @click="isRegisterMode = true"
                :class="{ 'active': isRegisterMode }"
                class="mode-btn"
              >
                <UserPlus class="w-4 h-4" />
                Initialize ID
              </button>
            </div>
            
            <!-- 📝 输入字段 -->
            <div class="input-group">
              <div class="neural-input-wrapper">
                <User class="input-icon" />
                <input 
                  v-model="username"
                  type="text"
                  placeholder="Neural ID"
                  class="neural-input"
                  :disabled="linkingMode"
                  @keyup.enter="executeNeuralLink"
                />
              </div>
              
              <div class="neural-input-wrapper">
                <Lock class="input-icon" />
                <input 
                  v-model="password"
                  type="password"
                  placeholder="Access Key"
                  class="neural-input"
                  :disabled="linkingMode"
                  @keyup.enter="executeNeuralLink"
                />
              </div>
              
              <!-- 📱 手机号（注册模式） -->
              <div v-if="isRegisterMode" class="neural-input-wrapper">
                <Phone class="input-icon" />
                <input 
                  v-model="phone"
                  type="tel"
                  placeholder="Emergency Contact (Optional)"
                  class="neural-input"
                  :disabled="linkingMode"
                />
              </div>
            </div>
            
            <!-- 🛡️ 验证码区域 -->
            <div class="captcha-section">
              <div class="captcha-display" @click="refreshCaptcha">
                <div v-if="captchaLoading" class="captcha-loading">
                  <Loader2 class="w-6 h-6 animate-spin" />
                </div>
                <img v-else-if="authStore.captchaImage" 
                     :src="authStore.captchaImage" 
                     alt="Security Code"
                     class="captcha-image"
                />
                <div v-else class="captcha-placeholder">
                  <Shield class="w-8 h-8" />
                  <span>Click to Load</span>
                </div>
              </div>
              
              <div class="neural-input-wrapper captcha-input">
                <Shield class="input-icon" />
                <input 
                  v-model="captcha"
                  type="text"
                  placeholder="Security Code"
                  class="neural-input"
                  :disabled="linkingMode"
                  maxlength="4"
                  @keyup.enter="executeNeuralLink"
                />
              </div>
            </div>
            
            <!-- 🚀 执行按钮 -->
            <button 
              @click="executeNeuralLink"
              :disabled="!canExecuteLink"
              class="neural-link-btn"
              :class="{ 'linking': linkingMode }"
            >
              <div class="btn-content">
                <component :is="linkingMode ? Loader2 : Zap" 
                          :class="{ 'animate-spin': linkingMode }" 
                          class="w-5 h-5" 
                />
                <span>{{ isRegisterMode ? 'INITIALIZE NEURAL LINK' : 'LINK START' }}</span>
              </div>
              
              <!-- 🌟 按钮特效 -->
              <div class="btn-fx">
                <div class="btn-glow"></div>
                <div class="btn-particles"></div>
              </div>
            </button>
            
            <!-- ❌ 错误提示 -->
            <Transition name="error-slide">
              <div v-if="hasError" class="error-panel">
                <AlertTriangle class="w-5 h-5" />
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>
            
          </div>
          
        </div>
      </Transition>
      
    </div>
    
    <!-- 🌌 背景网格 -->
    <div class="neural-grid"></div>
    
    <!-- ✨ 连接特效 -->
    <div v-if="linkingMode" class="linking-effects">
      <div class="energy-wave"></div>
      <div class="data-stream"></div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import TwilightParticles from '@/components/TwilightParticles.vue'
import { 
  Zap, User, Lock, KeyRound, UserPlus, Phone,
  Shield, Loader2, AlertTriangle
} from 'lucide-vue-next'

/**
 * 🧠 Neural Link v11.0 登录界面
 * SAO风格的神经连接体验
 */

const authStore = useAuthStore()

// 🎬 场景状态
type Scene = 'title' | 'link'
const currentScene = ref<Scene>('title')

// 🔗 认证模式
const isRegisterMode = ref(false)

// 📝 表单数据
const username = ref('')
const password = ref('')
const phone = ref('')
const captcha = ref('')

// 🛡️ 验证码状态
const captchaLoading = ref(false)

// 🚫 错误状态
const hasError = computed(() => !!authStore.lastError)
const errorMessage = computed(() => authStore.lastError || '')

// 🔗 连接状态
const linkingMode = computed(() => authStore.isLinking)
const linkingStage = ref('Initializing Neural Interface...')

// 🎯 状态计算
const syncRate = ref(0)
const showCursor = ref(true)

// 🔒 验证表单完整性
const canExecuteLink = computed(() => {
  return username.value.trim() && 
         password.value.trim() && 
         captcha.value.trim() &&
         !linkingMode.value
})

// ⏱️ 闪烁光标
let cursorInterval: number | null = null

// 🎬 进入连接模式
const enterLinkMode = () => {
  currentScene.value = 'link'
  // 自动获取验证码
  setTimeout(() => {
    refreshCaptcha()
  }, 500)
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

// 🚀 执行神经连接
const executeNeuralLink = async () => {
  if (!canExecuteLink.value) return
  
  // 连接阶段动画
  const stages = [
    'Initializing Neural Interface...',
    'Verifying Security Protocols...',
    'Establishing Quantum Tunnel...',
    'Synchronizing Memory Core...',
    'Neural Link Established!'
  ]
  
  let stageIndex = 0
  const stageInterval = setInterval(() => {
    if (stageIndex < stages.length) {
      linkingStage.value = stages[stageIndex]
      syncRate.value = Math.min(100, (stageIndex + 1) * 20)
      stageIndex++
    } else {
      clearInterval(stageInterval)
    }
  }, 600)
  
  try {
    if (isRegisterMode.value) {
      await authStore.register(username.value, password.value, captcha.value, phone.value || undefined)
    } else {
      await authStore.linkStart(username.value, password.value, captcha.value)
    }
    
    // 成功后清理
    clearInterval(stageInterval)
    
  } catch (error) {
    clearInterval(stageInterval)
    linkingStage.value = 'Neural Link Ready'
    syncRate.value = 0
    
    // 重新获取验证码
    setTimeout(() => {
      refreshCaptcha()
      captcha.value = ''
    }, 1000)
  }
}

// ⚡ 键盘快捷键
const handleKeyPress = (e: KeyboardEvent) => {
  if (currentScene.value === 'title') {
    enterLinkMode()
  }
}

onMounted(() => {
  // 光标闪烁
  cursorInterval = window.setInterval(() => {
    showCursor.value = !showCursor.value
  }, 800)
  
  // 键盘监听
  document.addEventListener('keydown', handleKeyPress)
  
  // 初始同步率动画
  const initSyncRate = () => {
    let rate = 0
    const interval = setInterval(() => {
      rate += Math.random() * 10
      if (rate >= 85) {
        syncRate.value = 85 + Math.random() * 10
        clearInterval(interval)
      } else {
        syncRate.value = rate
      }
    }, 100)
  }
  
  setTimeout(initSyncRate, 1000)
})

onUnmounted(() => {
  if (cursorInterval) {
    clearInterval(cursorInterval)
  }
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
/* 🧠 主容器 */
.neural-login-container {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, 
    rgba(0, 20, 40, 0.95) 0%,
    rgba(0, 10, 30, 0.98) 50%,
    rgba(0, 5, 20, 1) 100%
  );
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 🌌 背景网格 */
.neural-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridShift 20s linear infinite;
}

@keyframes gridShift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

/* 🧠 主面板 */
.neural-main-panel {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

/* 🎬 标题场景 */
.title-scene {
  text-align: center;
  cursor: pointer;
  transition: all 0.5s ease;
}

.title-scene:hover {
  transform: scale(1.02);
}

.neural-logo {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
}

.logo-core {
  font-size: 4rem;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.8));
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)); }
  50% { transform: scale(1.05); filter: drop-shadow(0 0 30px rgba(0, 255, 255, 1)); }
}

.logo-rings {
  position: absolute;
  inset: -20px;
}

.ring {
  position: absolute;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  animation: ringRotate 10s linear infinite;
}

.ring-1 {
  inset: 10px;
  animation-duration: 8s;
}

.ring-2 {
  inset: 5px;
  animation-duration: 12s;
  animation-direction: reverse;
}

.ring-3 {
  inset: 0;
  animation-duration: 15s;
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.neural-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: linear-gradient(45deg, #00ffff, #0080ff, #00ffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
}

.neural-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  letter-spacing: 0.1em;
  margin-bottom: 3rem;
}

.start-prompt {
  margin-top: 3rem;
}

.prompt-text {
  color: rgba(0, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.prompt-text.pulse {
  text-shadow: 0 0 10px rgba(0, 255, 255, 1);
}

/* 🔗 连接场景 */
.link-scene {
  width: 100%;
}

/* 🎯 状态面板 */
.status-panel {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 30, 60, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.status-indicator {
  display: inline-block;
  position: relative;
  margin-bottom: 0.5rem;
}

.indicator-core {
  width: 16px;
  height: 16px;
  background: rgba(0, 255, 255, 0.5);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
  animation: statusIdle 2s ease-in-out infinite;
}

.status-indicator.connecting .indicator-core {
  background: rgba(255, 255, 0, 0.8);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.8);
  animation: statusConnecting 0.5s ease-in-out infinite;
}

.status-indicator.error .indicator-core {
  background: rgba(255, 100, 100, 0.8);
  box-shadow: 0 0 20px rgba(255, 100, 100, 0.8);
  animation: statusError 1s ease-in-out infinite;
}

@keyframes statusIdle {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes statusConnecting {
  0%, 100% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
}

@keyframes statusError {
  0%, 100% { transform: scale(1); }
  25%, 75% { transform: scale(1.2); }
}

.status-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.sync-rate {
  color: rgba(0, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

/* 🧠 认证表单 */
.auth-form {
  background: rgba(0, 30, 60, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.auth-form.disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 🔐 模式切换 */
.auth-mode-toggle {
  display: flex;
  margin-bottom: 2rem;
  background: rgba(0, 20, 40, 0.5);
  border-radius: 10px;
  padding: 0.3rem;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.mode-btn.active {
  background: rgba(0, 255, 255, 0.2);
  color: rgba(0, 255, 255, 1);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

/* 📝 输入组 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.neural-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  width: 18px;
  height: 18px;
  color: rgba(0, 255, 255, 0.6);
  z-index: 2;
}

.neural-input {
  width: 100%;
  background: rgba(0, 30, 60, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 10px;
  padding: 0.8rem 1rem 0.8rem 3rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.neural-input:focus {
  outline: none;
  border-color: rgba(0, 255, 255, 0.8);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  background: rgba(0, 30, 60, 0.5);
}

.neural-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* 🛡️ 验证码区域 */
.captcha-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.captcha-display {
  flex-shrink: 0;
  width: 120px;
  height: 50px;
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.captcha-display:hover {
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.captcha-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 6px;
}

.captcha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7rem;
}

.captcha-loading {
  color: rgba(0, 255, 255, 0.8);
}

.captcha-input {
  flex: 1;
}

/* 🚀 主执行按钮 */
.neural-link-btn {
  position: relative;
  width: 100%;
  background: linear-gradient(45deg, rgba(0, 150, 255, 0.8), rgba(0, 255, 255, 0.6));
  border: 1px solid rgba(0, 255, 255, 0.8);
  border-radius: 12px;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.neural-link-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, rgba(0, 180, 255, 0.9), rgba(0, 255, 255, 0.8));
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
  transform: translateY(-2px);
}

.neural-link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.neural-link-btn.linking {
  background: linear-gradient(45deg, rgba(255, 200, 0, 0.8), rgba(255, 255, 0, 0.6));
  border-color: rgba(255, 255, 0, 0.8);
  box-shadow: 0 0 40px rgba(255, 255, 0, 0.5);
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.btn-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, rgba(0, 255, 255, 0.3), transparent);
  border-radius: 12px;
  filter: blur(8px);
  animation: btnGlow 3s ease-in-out infinite;
}

@keyframes btnGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ❌ 错误提示 */
.error-panel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  color: rgba(255, 150, 150, 0.9);
  font-size: 0.85rem;
}

/* ✨ 连接特效 */
.linking-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.energy-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  border: 2px solid rgba(0, 255, 255, 0.5);
  border-radius: 50%;
  animation: energyWave 2s ease-out infinite;
}

@keyframes energyWave {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.data-stream {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, 
    transparent 0%,
    rgba(0, 255, 255, 0.8) 30%,
    rgba(0, 255, 255, 1) 50%,
    rgba(0, 255, 255, 0.8) 70%,
    transparent 100%
  );
  animation: dataStream 1.5s ease-in-out infinite;
}

@keyframes dataStream {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 🎬 过渡动画 */
.neural-title-enter-active,
.neural-title-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.neural-title-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(50px);
  filter: blur(20px);
}

.neural-title-leave-to {
  opacity: 0;
  transform: scale(1.1) translateY(-50px);
  filter: blur(20px);
}

.neural-link-enter-active,
.neural-link-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.neural-link-enter-from {
  opacity: 0;
  transform: scale(0.8) rotateY(10deg);
  filter: blur(20px);
}

.neural-link-leave-to {
  opacity: 0;
  transform: scale(1.2) rotateY(-10deg);
  filter: blur(20px);
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 📱 响应式设计 */
@media (max-width: 768px) {
  .neural-main-panel {
    padding: 1rem;
  }
  
  .auth-form {
    padding: 1.5rem;
  }
  
  .neural-title {
    font-size: 2rem;
  }
  
  .captcha-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .captcha-display {
    width: 100%;
    height: 60px;
  }
}
</style>