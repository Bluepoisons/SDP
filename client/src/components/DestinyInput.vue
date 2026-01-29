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
