<script setup lang="ts">
import { X } from "lucide-vue-next";
import SettingsPanel from "@/components/panels/SettingsPanel.vue";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- 背景遮罩 -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          @click="emit('close')"
        ></div>

        <!-- 弹窗主体 -->
        <div class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-2xl transition-all">
          
          <!-- 关闭按钮 -->
          <button 
            @click="emit('close')"
            class="absolute right-4 top-4 z-10 rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>

          <!-- 内容区域 (复用现有的 SettingsPanel) -->
          <div class="max-h-[85vh] overflow-y-auto p-6 scrollbar-hide">
            <SettingsPanel />
          </div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 简单的弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.95) translateY(10px);
}

/* 隐藏滚动条但保持功能 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
