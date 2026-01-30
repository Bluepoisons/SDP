<script setup lang="ts">
import { X, Terminal } from "lucide-vue-next";
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
          class="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
          @click="emit('close')"
        ></div>

        <!-- 🎮 弹窗主体 - Diegetic UI 风格 -->
        <div class="settings-modal tech-border relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-[var(--accent-color)]/50 bg-[var(--bg-primary)]/95 shadow-2xl transition-all">
          
          <!-- 顶部装饰条 -->
          <div class="flex items-center justify-between border-b border-[var(--accent-color)]/30 bg-[var(--bg-secondary)]/50 px-6 py-3">
            <div class="flex items-center gap-3">
              <Terminal class="h-4 w-4 text-[var(--accent-color)]" />
              <span class="font-mono text-xs tracking-[0.2em] text-[var(--accent-color)]">SYSTEM_CONFIG.EXE</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="font-mono text-[10px] text-zinc-500">ACTIVE</span>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <button 
            @click="emit('close')"
            class="absolute right-4 top-3 z-10 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all hover:rotate-90"
          >
            <X class="h-4 w-4" />
          </button>

          <!-- 内容区域 -->
          <div class="max-h-[80vh] overflow-y-auto p-6">
            <SettingsPanel />
          </div>
          
          <!-- 底部装饰条 -->
          <div class="border-t border-[var(--accent-color)]/20 bg-[var(--bg-secondary)]/30 px-6 py-2">
            <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>ESC to close</span>
              <span>v3.0.42 // NEURAL_LINK</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 🎮 沉浸式弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .settings-modal,
.modal-leave-active .settings-modal {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-enter-from .settings-modal,
.modal-leave-to .settings-modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* 🔲 科技边框装饰 */
.settings-modal {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 30px var(--glow-color),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.settings-modal::before,
.settings-modal::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid var(--accent-color);
  opacity: 0.6;
  z-index: 10;
}

.settings-modal::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.settings-modal::after {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}
</style>
