<script setup lang="ts">
import { computed, watch } from "vue";
import { useTextareaAutosize } from "@vueuse/core";
import Button from "@/components/ui/button/Button.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";

interface DestinyInputProps {
  modelValue: string;
  loading?: boolean;
  placeholder?: string;
  statusText?: string;
}

const props = withDefaults(defineProps<DestinyInputProps>(), {
  modelValue: "",
  loading: false,
  placeholder: "Enter the dialogue to weave destiny...",
  statusText: "Syncing with timeline...",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "generate"): void;
  (e: "cancel"): void;
  (e: "capture"): void;
  (e: "upload"): void;
}>();

const { textarea, input } = useTextareaAutosize({
  input: props.modelValue,
});

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
</script>

<template>
  <div class="w-full">
    <!-- 🎮 v5.0: 悬浮控制台面板 -->
    <div class="input-cockpit">
      <!-- 🔝 状态指示条 -->
      <div
        v-if="props.loading"
        class="absolute left-0 right-0 top-0 h-[2px] overflow-hidden"
      >
        <div class="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent animate-pulse"></div>
      </div>
      
      <!-- 💬 主输入区 -->
      <div class="flex items-end gap-4">
        <Textarea
          v-model="input"
          :textarea-ref="textarea"
          :placeholder="props.placeholder"
          class="min-h-[64px] flex-1 resize-none border-none bg-transparent text-base text-[var(--input-text)] placeholder:text-[var(--input-text)] placeholder:opacity-40 focus-visible:ring-0"
          :disabled="props.loading"
          style="font-family: var(--font-primary); letter-spacing: var(--letter-spacing-normal);"
        />

        <!-- 🎯 功能按钮组 -->
        <div class="flex items-center gap-2">
          <Tooltip content="截图识别">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full border border-[var(--input-panel-border)] bg-transparent hover:bg-[var(--btn-primary-hover)]"
              @click="emit('capture')"
            >
              📷
            </Button>
          </Tooltip>
          <Tooltip content="上传图片">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full border border-[var(--input-panel-border)] bg-transparent hover:bg-[var(--btn-primary-hover)]"
              @click="emit('upload')"
            >
              🖼️
            </Button>
          </Tooltip>

          <!-- 🔘 主生成按钮 (跳动的心脏 / 旋转的星盘) -->
          <Tooltip :content="props.loading ? '取消生成' : '生成选项'">
            <Button
              class="btn-action btn-pulse h-12 w-12 rounded-full text-white shadow-2xl transition-all"
              :disabled="!isReady && !props.loading"
              @click="props.loading ? emit('cancel') : emit('generate')"
            >
              <span class="text-2xl">
                {{ props.loading ? '⏸' : '▶' }}
              </span>
            </Button>
          </Tooltip>
        </div>
      </div>

      <!-- 📊 底部状态栏 -->
      <div class="mt-2 flex items-center justify-between text-xs opacity-60">
        <span style="font-family: var(--font-mono);">⌘ / Ctrl + Enter</span>
        <span>{{ props.statusText }}</span>
      </div>
    </div>
  </div>
</template>
