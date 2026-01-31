<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { Camera, ImagePlus, Zap, Plus, Command } from "lucide-vue-next";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
import TacticalIntent, { type TacticalIntentType } from "@/components/TacticalIntent.vue";

/**
 * 🎮 驾驶舱输入框 v8.1
 * 「直出+热修」模式：输入即生成，战术意图可选
 */

interface DestinyInputProps {
  modelValue: string;
  loading?: boolean;
  placeholder?: string;
  statusText?: string;
  tacticalIntent?: TacticalIntentType;
  showOverrideButton?: boolean;
}

const props = withDefaults(defineProps<DestinyInputProps>(), {
  modelValue: "",
  loading: false,
  placeholder: "输入对话内容，编织命运轨迹...",
  statusText: "SYSTEM READY",
  tacticalIntent: null,
  showOverrideButton: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:tacticalIntent", value: TacticalIntentType): void;
  (e: "generate"): void;
  (e: "cancel"): void;
  (e: "capture"): void;
  (e: "upload"): void;
  (e: "override"): void;
  (e: "focus"): void;  // v9.0: 聚焦时触发滚动
}>();

const input = ref(props.modelValue);
const isFocused = ref(false);
const isBurstMode = ref(false); // v8.0: 连发模式开关

watch(
  () => props.modelValue,
  (value) => {
    if (value !== input.value) {
      input.value = value;
    }
  }
);

watch(input, (value) => emit("update:modelValue", value));

const isReady = computed(() => !props.loading && input.value.trim().length > 0);
const charCount = computed(() => input.value.length);

// v8.0: 计算连发气泡数量
const burstLines = computed(() => {
  if (!input.value.trim()) return [];
  return input.value.split('\n').filter(line => line.trim());
});

const burstCount = computed(() => burstLines.value.length);

// v8.0: 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // Shift + Enter: 换行（连发模式）
  if (event.key === 'Enter' && event.shiftKey) {
    // 默认行为是换行，无需阻止
    if (!isBurstMode.value) {
      isBurstMode.value = true;
    }
    return;
  }
  
  // Enter: 发送（非连发模式或未按 Shift）
  if (event.key === 'Enter' && !event.shiftKey && !isBurstMode.value) {
    event.preventDefault();
    if (isReady.value && !props.loading) {
      handleLaunch();
    }
  }
};

// 🚀 P1: 发射动画
const isLaunching = ref(false);

const handleLaunch = async () => {
  if (!isReady.value || props.loading) return;
  
  // 1. 播放发射动画
  isLaunching.value = true;
  
  // 2. 等待动画播放一半
  await new Promise(r => setTimeout(r, 150));
  
  // 3. 真正触发发送
  emit('generate');
  
  // 4. 重置状态
  setTimeout(() => {
    isLaunching.value = false;
  }, 200);
};

// v8.0: 添加新气泡（点击 + 按钮）
const addBubble = () => {
  if (!isBurstMode.value) {
    isBurstMode.value = true;
  }
  if (input.value && !input.value.endsWith('\n')) {
    input.value += '\n';
  }
};

// v8.0: 切换连发模式
const toggleBurstMode = () => {
  isBurstMode.value = !isBurstMode.value;
  // 退出连发模式时合并为单行
  if (!isBurstMode.value && input.value.includes('\n')) {
    input.value = input.value.replace(/\n+/g, ' ').trim();
  }
};

// v8.1: 战术意图更新
const handleIntentUpdate = (intent: TacticalIntentType) => {
  emit('update:tacticalIntent', intent);
};

// v9.0: 连发警告消息（带彩蛋）
const warningMessage = computed(() => {
  const count = burstCount.value;
  if (count >= 6) {
    return `WARNING：前方${count}条信息准备发射⁽⁽٩(๑˃̶͈̀ ᗨ ˂̶͈́)۶⁾⁾`;
  }
  if (count >= 2) {
    return `WARNING：${count}条信息已经准备(｡･∀･)ﾉ`;
  }
  return '';
});
</script>

<template>
  <div class="w-full">
    <!-- v9.0: 连发警告提示（带动画） -->
    <Transition name="burst-warning">
      <div 
        v-if="burstCount >= 2" 
        class="burst-warning mb-3"
        :class="{ 'burst-warning-critical': burstCount >= 6 }"
      >
        <div class="burst-warning-inner">
          <!-- 闪烁警告图标 -->
          <span class="warning-icon">⚠</span>
          
          <!-- 动态文字 -->
          <span class="warning-text">
            <Transition name="text-slide" mode="out-in">
              <span :key="warningMessage" class="warning-message">
                {{ warningMessage }}
              </span>
            </Transition>
          </span>
          
          <!-- 数量徽章 -->
          <Transition name="badge-pop" mode="out-in">
            <span :key="burstCount" class="warning-badge">
              ×{{ burstCount }}
            </span>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- 🎮 v6.0: 驾驶舱控制台 -->
    <div 
      class="input-cockpit tech-corner"
      :class="{ 'idle-glow': isFocused || props.loading }"
    >
      <!--  顶部装饰栏 -->
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <span class="deco-text text-[var(--accent-color)]">INPUT_STREAM</span>
          <span class="deco-text">///</span>
          <span class="deco-text">NO.{{ String(charCount).padStart(3, '0') }}</span>
          
          <!-- v8.0: 连发模式指示器 -->
          <button 
            v-if="burstCount > 1"
            class="burst-indicator"
            @click="toggleBurstMode"
          >
            <span class="text-amber-400">{{ burstCount }}x</span>
          </button>
        </div>
        
        <!-- 🎵 波形图 (加载时显示) -->
        <div v-if="props.loading" class="waveform">
          <div class="waveform-bar" v-for="i in 5" :key="i"></div>
        </div>
        
        <span v-else class="deco-text text-[var(--accent-secondary)]">{{ props.statusText }}</span>
      </div>
      
      <!-- 💬 主输入区 -->
      <div class="flex items-end gap-4">
        <!-- v8.0: 添加气泡按钮 -->
        <div class="flex flex-col gap-2">
          <Tooltip :content="isBurstMode ? '退出连发模式' : '连发模式 (Shift+Enter)'">
            <button
              class="btn-skew flex h-8 w-8 items-center justify-center border text-[var(--accent-secondary)] transition-all"
              :class="isBurstMode 
                ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' 
                : 'border-[var(--input-panel-border)] bg-[var(--bg-secondary)]'"
              @click="addBubble"
            >
              <Plus class="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <!-- 输入框容器 -->
        <div 
          class="relative flex-1 glass-panel rounded-lg p-3"
          :class="{ 'input-launching': isLaunching }"
        >
          <Textarea
            v-model="input"
            ref="textarea"
            :placeholder="isBurstMode ? '按 Shift+Enter 添加新消息...' : props.placeholder"
            class="min-h-[48px] w-full resize-none border-none bg-transparent text-base text-[var(--bubble-text)] placeholder:text-[var(--bubble-text)] placeholder:opacity-30 focus-visible:ring-0"
            :disabled="props.loading"
            style="font-family: var(--font-primary); letter-spacing: var(--letter-spacing-normal);"
            @focus="isFocused = true; emit('focus')"
            @blur="isFocused = false"
            @keydown="handleKeyDown"
          />
          
          <!-- 刻度线装饰 -->
          <div class="hud-scale absolute bottom-0 left-0 right-0 h-px opacity-50"></div>
        </div>

        <!-- 🎯 功能按钮组 (散落式) -->
        <div class="flex flex-col gap-2">
          <Tooltip content="截图识别">
            <button
              class="btn-skew flex h-8 w-8 items-center justify-center border border-[var(--input-panel-border)] bg-[var(--bg-secondary)] text-[var(--accent-color)] hover:bg-[var(--btn-primary-hover)] transition-all"
              @click="emit('capture')"
            >
              <Camera class="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip content="上传图片">
            <button
              class="btn-skew flex h-8 w-8 items-center justify-center border border-[var(--input-panel-border)] bg-[var(--bg-secondary)] text-[var(--accent-secondary)] hover:bg-[var(--btn-primary-hover)] transition-all"
              @click="emit('upload')"
            >
              <ImagePlus class="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <!-- 🔘 扳机按钮 (Trigger) -->
        <Tooltip :content="props.loading ? '取消生成' : '发射！'">
          <button
            class="trigger-btn flex items-center justify-center text-white"
            :class="{ 
              'opacity-50 cursor-not-allowed': !isReady && !props.loading,
              'trigger-launching': isLaunching
            }"
            :disabled="!isReady && !props.loading"
            @click="props.loading ? emit('cancel') : handleLaunch()"
          >
            <Zap 
              class="h-6 w-6" 
              :class="props.loading ? 'animate-spin' : ''"
            />
          </button>
        </Tooltip>
      </div>

      <!-- 🎯 v8.1: 战术意图选择栏 + 介入指挥按钮 -->
      <div class="mt-3 flex items-center justify-between">
        <!-- 左侧：战术意图 -->
        <TacticalIntent
          :model-value="props.tacticalIntent"
          :disabled="props.loading"
          @update:model-value="handleIntentUpdate"
        />
        
        <!-- 右侧：介入指挥按钮（生成后显示） -->
        <Tooltip v-if="showOverrideButton" content="介入指挥 - 覆盖当前结果">
          <button
            class="override-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
              border border-amber-500/30 bg-amber-500/10 text-amber-400
              hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
            @click="emit('override')"
          >
            <Command class="w-3.5 h-3.5" />
            <span>介入指挥</span>
          </button>
        </Tooltip>
        
        <!-- 状态指示器 -->
        <div v-else class="flex items-center gap-2 text-xs">
          <span 
            class="inline-block h-2 w-2 rounded-full"
            :class="isReady ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'"
          ></span>
          <span class="deco-text">{{ isReady ? 'READY' : 'STANDBY' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 🎮 驾驶舱主体 - 悬浮控制台 */
.input-cockpit {
  position: relative;
  padding: 1rem 1.25rem;
  background: var(--input-panel-bg);
  border: 1px solid var(--input-panel-border);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

/* 聚焦时微光效果 - 极简版 */
.input-cockpit.idle-glow {
  border-color: var(--accent-color);
  /* 🎨 极简光效：仅保留细微边框发光 */
  box-shadow: 
    0 0 1px rgba(var(--accent-color), 0.5),
    inset 0 0 10px rgba(0, 0, 0, 0.3);
}

/* 移除呼吸动画，保持静态 */

/* 🔝 HUD 扫描线 */
.hud-scan {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--accent-color) 50%,
    transparent 100%
  );
  animation: scan-down 4s linear infinite;
}

@keyframes scan-down {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); }
}

/* 🎵 波形动画 */
.waveform {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 16px;
}

.waveform-bar {
  width: 3px;
  height: 100%;
  background: var(--accent-color);
  border-radius: 2px;
  animation: wave-bounce 0.8s ease-in-out infinite;
}

.waveform-bar:nth-child(1) { animation-delay: 0s; }
.waveform-bar:nth-child(2) { animation-delay: 0.1s; }
.waveform-bar:nth-child(3) { animation-delay: 0.2s; }
.waveform-bar:nth-child(4) { animation-delay: 0.3s; }
.waveform-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave-bounce {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

/* 📝 装饰文字 */
.deco-text {
  font-family: var(--font-tech, 'Rajdhani', monospace);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* 💬 玻璃面板输入区 */
.glass-panel {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--input-panel-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.glass-panel:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 15px var(--glow-color);
}

/* 📏 底部刻度线 */
.hud-scale {
  background: repeating-linear-gradient(
    90deg,
    var(--accent-color) 0px,
    var(--accent-color) 1px,
    transparent 1px,
    transparent 10px
  );
}

/* 🎯 斜切功能按钮 */
.btn-skew {
  border-radius: 6px;
  transform: skewX(var(--skew-angle-subtle, -6deg));
  transition: all 0.2s ease;
}

.btn-skew:hover {
  box-shadow: 0 0 12px var(--glow-color);
}

.btn-skew:active {
  transform: skewX(var(--skew-angle-subtle, -6deg)) scale(0.95) translateY(1px);
}

/* 心跳模式：圆润按钮 */
:global(body.theme-heartbeat) .btn-skew {
  transform: skewX(0);
  border-radius: 9999px;
}

:global(body.theme-heartbeat) .btn-skew:active {
  transform: scale(0.95) translateY(1px);
}

/* 🔘 扳机按钮 */
.trigger-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--btn-primary-from), var(--btn-primary-to));
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px var(--btn-primary-shadow);
  
  /* 深潜模式：菱形 */
  border-radius: 8px;
  transform: rotate(45deg);
}

.trigger-btn > * {
  transform: rotate(-45deg);
}

.trigger-btn:hover:not(:disabled) {
  box-shadow: 0 6px 30px var(--glow-strong);
  transform: rotate(45deg) scale(1.05);
}

.trigger-btn:active:not(:disabled) {
  transform: rotate(45deg) scale(0.95);
}

/* 🚀 发射动画 */
@keyframes launch-pulse {
  0% { 
    transform: rotate(45deg) scale(1);
    box-shadow: 0 4px 20px var(--btn-primary-shadow);
  }
  40% { 
    transform: rotate(45deg) scale(1.15);
    box-shadow: 0 0 30px var(--glow-strong), 0 0 60px var(--accent-color);
  }
  100% { 
    transform: rotate(45deg) scale(1);
    box-shadow: 0 4px 20px var(--btn-primary-shadow);
  }
}

.trigger-launching {
  animation: launch-pulse 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 输入框发射时的收缩效果 */
@keyframes input-launch {
  0% { 
    transform: scale(1);
    opacity: 1;
  }
  30% { 
    transform: scale(0.98) translateY(-2px);
    opacity: 0.9;
  }
  100% { 
    transform: scale(1);
    opacity: 1;
  }
}

.input-launching {
  animation: input-launch 0.25s ease-out;
}

/* 心跳模式：圆形扳机 */
:global(body.theme-heartbeat) .trigger-btn {
  border-radius: 50%;
  transform: rotate(0);
}

:global(body.theme-heartbeat) .trigger-btn > * {
  transform: rotate(0);
}

:global(body.theme-heartbeat) .trigger-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

:global(body.theme-heartbeat) .trigger-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* 心跳模式发射动画 */
@keyframes launch-pulse-round {
  0% { 
    transform: scale(1);
    box-shadow: 0 4px 20px var(--btn-primary-shadow);
  }
  40% { 
    transform: scale(1.15);
    box-shadow: 0 0 30px var(--glow-strong), 0 0 60px var(--accent-color);
  }
  100% { 
    transform: scale(1);
    box-shadow: 0 4px 20px var(--btn-primary-shadow);
  }
}

:global(body.theme-heartbeat) .trigger-launching {
  animation: launch-pulse-round 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ☀️ 清晨模式：圆润扳机 */
:global(body.theme-morning) .trigger-btn {
  border-radius: 50%;
  transform: rotate(0);
  background: linear-gradient(135deg, var(--btn-primary-from), var(--btn-primary-to));
}

:global(body.theme-morning) .trigger-btn > * {
  transform: rotate(0);
}

:global(body.theme-morning) .trigger-btn:hover:not(:disabled) {
  transform: scale(1.08);
}

:global(body.theme-morning) .trigger-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* 清晨模式发射动画 */
:global(body.theme-morning) .trigger-launching {
  animation: launch-pulse-round 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ☀️ 清晨模式：移除科技角落 */
:global(body.theme-morning) .tech-corner::before,
:global(body.theme-morning) .tech-corner::after {
  display: none;
}

/* ☀️ 清晨模式：按钮圆润化 */
:global(body.theme-morning) .btn-skew {
  transform: skewX(0);
  border-radius: 12px;
}

:global(body.theme-morning) .btn-skew:active {
  transform: scale(0.95) translateY(1px);
}

/* 科技感角落 */
.tech-corner {
  position: relative;
}

.tech-corner::before,
.tech-corner::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--accent-color);
  opacity: 0.5;
  pointer-events: none;
}

.tech-corner::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.tech-corner::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

/* ==================== v9.0: 连发警告样式 ==================== */

/* 警告容器 */
.burst-warning {
  padding: 10px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

/* 高危状态（6+条） */
.burst-warning-critical {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  animation: warning-pulse 1s ease-in-out infinite;
}

@keyframes warning-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% { 
    box-shadow: 0 0 20px 2px rgba(239, 68, 68, 0.3);
  }
}

/* 内部布局 */
.burst-warning-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 警告图标 */
.warning-icon {
  font-size: 16px;
  animation: icon-blink 0.8s ease-in-out infinite;
}

.burst-warning-critical .warning-icon {
  color: #ef4444;
  animation: icon-shake 0.3s ease-in-out infinite;
}

@keyframes icon-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes icon-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* 警告文字 */
.warning-text {
  flex: 1;
  font-family: var(--font-tech, 'Rajdhani', monospace);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: rgba(245, 158, 11, 0.9);
  white-space: nowrap;
  overflow: hidden;
}

.burst-warning-critical .warning-text {
  color: rgba(239, 68, 68, 0.95);
}

.warning-message {
  display: inline-block;
}

/* 数量徽章 */
.warning-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: bold;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 6px;
}

.burst-warning-critical .warning-badge {
  color: #f87171;
  background: rgba(239, 68, 68, 0.2);
}

/* 警告容器进场动画 - 弹入效果 */
.burst-warning-enter-active {
  animation: burst-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.burst-warning-leave-active {
  animation: burst-bounce-out 0.3s ease-out forwards;
}

@keyframes burst-bounce-in {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes burst-bounce-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-15px) scale(0.9);
  }
}

/* 文字滑动动画 */
.text-slide-enter-active,
.text-slide-leave-active {
  transition: all 0.3s ease;
}

.text-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.text-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 徽章弹出动画 */
.badge-pop-enter-active,
.badge-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.badge-pop-leave-to {
  opacity: 0;
  transform: scale(1.3);
}

/* 连发指示器按钮 */
.burst-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.burst-indicator:hover {
  background: rgba(245, 158, 11, 0.25);
}
</style>