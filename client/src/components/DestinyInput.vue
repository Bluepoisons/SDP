<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { Camera, ImagePlus, Zap } from "lucide-vue-next";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";

/**
 * 🎮 驾驶舱输入框 v6.0
 * HUD 元素 + 波形图 + 扳机按钮
 */

interface DestinyInputProps {
  modelValue: string;
  loading?: boolean;
  placeholder?: string;
  statusText?: string;
}

const props = withDefaults(defineProps<DestinyInputProps>(), {
  modelValue: "",
  loading: false,
  placeholder: "输入对话内容，编织命运轨迹...",
  statusText: "SYSTEM READY",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "generate"): void;
  (e: "cancel"): void;
  (e: "capture"): void;
  (e: "upload"): void;
}>();

const input = ref(props.modelValue);
const isFocused = ref(false);

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
</script>

<template>
  <div class="w-full">
    <!-- 🎮 v6.0: 驾驶舱控制台 -->
    <div 
      class="input-cockpit tech-corner"
      :class="{ 'idle-glow': isFocused || props.loading }"
    >
      <!-- 🔝 HUD 扫描线 -->
      <div class="hud-scan absolute left-0 right-0 top-0 h-full pointer-events-none opacity-30"></div>
      
      <!-- 📍 顶部装饰栏 -->
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <span class="deco-text text-[var(--accent-color)]">INPUT_STREAM</span>
          <span class="deco-text">///</span>
          <span class="deco-text">NO.{{ String(charCount).padStart(3, '0') }}</span>
        </div>
        
        <!-- 🎵 波形图 (加载时显示) -->
        <div v-if="props.loading" class="waveform">
          <div class="waveform-bar" v-for="i in 5" :key="i"></div>
        </div>
        
        <span v-else class="deco-text text-[var(--accent-secondary)]">{{ props.statusText }}</span>
      </div>
      
      <!-- 💬 主输入区 -->
      <div class="flex items-end gap-4">
        <!-- 输入框容器 -->
        <div class="relative flex-1 glass-panel rounded-lg p-3">
          <Textarea
            v-model="input"
            ref="textarea"
            :placeholder="props.placeholder"
            class="min-h-[48px] w-full resize-none border-none bg-transparent text-base text-[var(--bubble-text)] placeholder:text-[var(--bubble-text)] placeholder:opacity-30 focus-visible:ring-0"
            :disabled="props.loading"
            style="font-family: var(--font-primary); letter-spacing: var(--letter-spacing-normal);"
            @focus="isFocused = true"
            @blur="isFocused = false"
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
            :class="{ 'opacity-50 cursor-not-allowed': !isReady && !props.loading }"
            :disabled="!isReady && !props.loading"
            @click="props.loading ? emit('cancel') : emit('generate')"
          >
            <Zap 
              class="h-6 w-6" 
              :class="props.loading ? 'animate-spin' : ''"
            />
          </button>
        </Tooltip>
      </div>

      <!-- 📊 底部状态栏 -->
      <div class="mt-3 flex items-center justify-between text-xs px-1">
        <div class="flex items-center gap-3">
          <span class="deco-text">⌘ + ENTER</span>
          <span class="deco-text text-[var(--accent-color)]">EXECUTE</span>
        </div>
        <div class="flex items-center gap-2">
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

/* 聚焦时呼吸灯光效 */
.input-cockpit.idle-glow {
  border-color: var(--accent-color);
  box-shadow: 
    0 0 20px var(--glow-color),
    inset 0 0 30px rgba(0, 0, 0, 0.3);
  animation: breathe-glow 3s ease-in-out infinite;
}

@keyframes breathe-glow {
  0%, 100% { box-shadow: 0 0 20px var(--glow-color), inset 0 0 30px rgba(0, 0, 0, 0.3); }
  50% { box-shadow: 0 0 35px var(--glow-strong), inset 0 0 40px rgba(0, 0, 0, 0.4); }
}

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
</style>