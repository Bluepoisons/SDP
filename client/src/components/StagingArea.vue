<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  ArrowLeftRight,
  Trash2,
  Check,
  X,
  MessageSquare,
  User,
  Bot,
  AlertCircle,
  Sparkles,
} from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";

/**
 * 🎯 StagingArea v8.0 - OCR 预审校对区
 * 智能截图工作流的关键组件
 * 
 * 功能：
 * 1. 左右分轨：根据 x 坐标判定消息归属
 * 2. 一键切换：错判时可手动调整左右
 * 3. 垃圾清理：删除时间戳、图标等噪点
 * 4. 确认发送：校对完成后进入分析阶段
 */

interface OCRBlock {
  id: string;
  text: string;
  x: number;           // 原始 x 坐标
  y: number;           // 原始 y 坐标
  width: number;
  height: number;
  side: "left" | "right";  // left=对方, right=我方
  isNoise?: boolean;   // 是否为噪点（时间戳等）
}

interface StagingAreaProps {
  blocks: OCRBlock[];
  imageWidth?: number;
  isProcessing?: boolean;
}

const props = withDefaults(defineProps<StagingAreaProps>(), {
  blocks: () => [],
  imageWidth: 1080,
  isProcessing: false,
});

const emit = defineEmits<{
  (e: "confirm", blocks: OCRBlock[]): void;
  (e: "cancel"): void;
  (e: "update:blocks", blocks: OCRBlock[]): void;
}>();

// 本地可编辑的消息块
const localBlocks = ref<OCRBlock[]>([]);

// 同步 props
watch(
  () => props.blocks,
  (newBlocks) => {
    localBlocks.value = newBlocks.map((b) => ({ ...b }));
  },
  { immediate: true, deep: true }
);

// 分离左右消息
const leftMessages = computed(() =>
  localBlocks.value
    .filter((b) => b.side === "left" && !b.isNoise)
    .sort((a, b) => a.y - b.y)
);

const rightMessages = computed(() =>
  localBlocks.value
    .filter((b) => b.side === "right" && !b.isNoise)
    .sort((a, b) => a.y - b.y)
);

const noiseBlocks = computed(() =>
  localBlocks.value.filter((b) => b.isNoise)
);

// 统计信息
const stats = computed(() => ({
  total: localBlocks.value.length,
  left: leftMessages.value.length,
  right: rightMessages.value.length,
  noise: noiseBlocks.value.length,
}));

// 切换消息归属（左 <-> 右）
function toggleSide(blockId: string) {
  const block = localBlocks.value.find((b) => b.id === blockId);
  if (block) {
    block.side = block.side === "left" ? "right" : "left";
    emit("update:blocks", localBlocks.value);
  }
}

// 标记为噪点
function markAsNoise(blockId: string) {
  const block = localBlocks.value.find((b) => b.id === blockId);
  if (block) {
    block.isNoise = true;
    emit("update:blocks", localBlocks.value);
  }
}

// 恢复噪点
function restoreBlock(blockId: string) {
  const block = localBlocks.value.find((b) => b.id === blockId);
  if (block) {
    block.isNoise = false;
    emit("update:blocks", localBlocks.value);
  }
}

// 删除消息块
function deleteBlock(blockId: string) {
  localBlocks.value = localBlocks.value.filter((b) => b.id !== blockId);
  emit("update:blocks", localBlocks.value);
}

// 确认并发送
function confirmAndSend() {
  const validBlocks = localBlocks.value.filter((b) => !b.isNoise);
  emit("confirm", validBlocks);
}

// 合并输出文本
const outputText = computed(() => {
  const sorted = [...localBlocks.value]
    .filter((b) => !b.isNoise)
    .sort((a, b) => a.y - b.y);

  return sorted
    .map((b) => `[${b.side === "left" ? "对方" : "我方"}] ${b.text}`)
    .join("\n");
});
</script>

<template>
  <div class="staging-area tech-corner">
    <!-- 🎯 标题栏 -->
    <div class="staging-header">
      <div class="flex items-center gap-2">
        <div class="icon-wrapper pulse-gold">
          <Sparkles class="h-4 w-4 text-[var(--accent-color)]" />
        </div>
        <span class="font-mono text-sm text-[var(--accent-color)] tracking-wider">
          OCR_STAGING_AREA
        </span>
        <span class="deco-text">///</span>
        <span class="stats-badge">
          {{ stats.left }} 对方 · {{ stats.right }} 我方
        </span>
      </div>

      <!-- 统计信息 -->
      <div class="flex items-center gap-3 text-xs">
        <span v-if="stats.noise > 0" class="noise-badge">
          <AlertCircle class="h-3 w-3" />
          {{ stats.noise }} 噪点已过滤
        </span>
      </div>
    </div>

    <!-- 📊 双轨消息预览 -->
    <div class="dual-track">
      <!-- 左轨：对方消息 -->
      <div class="track track-left">
        <div class="track-label">
          <Bot class="h-4 w-4" />
          <span>对方 (Target)</span>
        </div>
        <div class="track-content">
          <TransitionGroup name="bubble-list">
            <div
              v-for="block in leftMessages"
              :key="block.id"
              class="message-block left"
            >
              <div class="bubble-content">
                <p>{{ block.text }}</p>
              </div>
              <div class="block-actions">
                <button
                  class="action-btn swap"
                  title="移到右边（我方）"
                  @click="toggleSide(block.id)"
                >
                  <ArrowLeftRight class="h-3 w-3" />
                </button>
                <button
                  class="action-btn delete"
                  title="标记为噪点"
                  @click="markAsNoise(block.id)"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            </div>
          </TransitionGroup>
          <div v-if="leftMessages.length === 0" class="empty-track">
            <MessageSquare class="h-6 w-6 opacity-30" />
            <span>暂无对方消息</span>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="track-divider">
        <div class="divider-line"></div>
        <div class="divider-label">VS</div>
        <div class="divider-line"></div>
      </div>

      <!-- 右轨：我方消息 -->
      <div class="track track-right">
        <div class="track-label">
          <User class="h-4 w-4" />
          <span>我方 (User)</span>
        </div>
        <div class="track-content">
          <TransitionGroup name="bubble-list">
            <div
              v-for="block in rightMessages"
              :key="block.id"
              class="message-block right"
            >
              <div class="bubble-content">
                <p>{{ block.text }}</p>
              </div>
              <div class="block-actions">
                <button
                  class="action-btn swap"
                  title="移到左边（对方）"
                  @click="toggleSide(block.id)"
                >
                  <ArrowLeftRight class="h-3 w-3" />
                </button>
                <button
                  class="action-btn delete"
                  title="标记为噪点"
                  @click="markAsNoise(block.id)"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            </div>
          </TransitionGroup>
          <div v-if="rightMessages.length === 0" class="empty-track">
            <MessageSquare class="h-6 w-6 opacity-30" />
            <span>暂无我方消息</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 🗑️ 噪点回收站 -->
    <div v-if="noiseBlocks.length > 0" class="noise-bin">
      <div class="noise-header">
        <Trash2 class="h-3 w-3" />
        <span>已过滤噪点 (点击恢复)</span>
      </div>
      <div class="noise-items">
        <button
          v-for="block in noiseBlocks"
          :key="block.id"
          class="noise-chip"
          @click="restoreBlock(block.id)"
        >
          {{ block.text }}
          <X class="h-3 w-3" @click.stop="deleteBlock(block.id)" />
        </button>
      </div>
    </div>

    <!-- 🚀 操作栏 -->
    <div class="staging-actions">
      <Button variant="ghost" size="sm" @click="$emit('cancel')">
        <X class="h-4 w-4 mr-1" />
        取消
      </Button>
      <Button
        variant="default"
        size="sm"
        class="btn-gold"
        :disabled="stats.left + stats.right === 0 || isProcessing"
        @click="confirmAndSend"
      >
        <template v-if="isProcessing">
          <span class="loading-spinner mr-2"></span>
          处理中...
        </template>
        <template v-else>
          <Check class="h-4 w-4 mr-1" />
          生成战报
        </template>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.staging-area {
  background: hsla(280, 35%, 15%, 0.9);
  border: 1px solid hsla(45, 100%, 65%, 0.3);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 hsla(45, 100%, 80%, 0.1);
}

.staging-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid hsla(45, 100%, 65%, 0.15);
}

.icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsla(45, 100%, 65%, 0.15);
  border-radius: 6px;
}

.pulse-gold {
  animation: pulse-gold 2s ease-in-out infinite;
}

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 hsla(45, 100%, 65%, 0.4); }
  50% { box-shadow: 0 0 0 6px hsla(45, 100%, 65%, 0); }
}

.deco-text {
  color: hsla(45, 100%, 65%, 0.4);
  font-family: var(--font-mono);
}

.stats-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: hsla(45, 100%, 65%, 0.15);
  border: 1px solid hsla(45, 100%, 65%, 0.3);
  border-radius: 4px;
  color: var(--accent-color);
}

.noise-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: hsla(0, 70%, 50%, 0.2);
  border-radius: 4px;
  color: hsl(0, 70%, 65%);
}

/* 双轨布局 */
.dual-track {
  display: flex;
  gap: 0.5rem;
  min-height: 200px;
  max-height: 350px;
}

.track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.track-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 0.25rem;
}

.track-left .track-label {
  background: hsla(280, 50%, 40%, 0.3);
  color: hsl(280, 60%, 75%);
}

.track-right .track-label {
  background: hsla(25, 70%, 40%, 0.3);
  color: hsl(35, 80%, 70%);
}

.track-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: hsla(0, 0%, 0%, 0.2);
  border-radius: 8px;
}

.track-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
}

.divider-line {
  flex: 1;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    hsla(45, 100%, 65%, 0.3),
    transparent
  );
}

.divider-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: hsla(45, 100%, 65%, 0.5);
  padding: 4px 0;
}

/* 消息块样式 */
.message-block {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.message-block.left {
  flex-direction: row;
}

.message-block.right {
  flex-direction: row-reverse;
}

.bubble-content {
  flex: 1;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
  max-width: 100%;
  word-break: break-word;
}

.message-block.left .bubble-content {
  background: hsla(280, 45%, 30%, 0.8);
  border: 1px solid hsla(280, 50%, 50%, 0.3);
  border-radius: 12px 12px 12px 4px;
}

.message-block.right .bubble-content {
  background: hsla(25, 60%, 30%, 0.8);
  border: 1px solid hsla(35, 80%, 50%, 0.3);
  border-radius: 12px 12px 4px 12px;
}

.block-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-block:hover .block-actions {
  opacity: 1;
}

.action-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.swap {
  background: hsla(45, 100%, 65%, 0.2);
  color: hsl(45, 100%, 65%);
}

.action-btn.swap:hover {
  background: hsla(45, 100%, 65%, 0.4);
}

.action-btn.delete {
  background: hsla(0, 70%, 50%, 0.2);
  color: hsl(0, 70%, 60%);
}

.action-btn.delete:hover {
  background: hsla(0, 70%, 50%, 0.4);
}

.empty-track {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: hsla(0, 0%, 100%, 0.3);
  font-size: 0.75rem;
}

/* 噪点回收站 */
.noise-bin {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: hsla(0, 0%, 0%, 0.2);
  border-radius: 8px;
  border: 1px dashed hsla(0, 70%, 50%, 0.3);
}

.noise-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: hsla(0, 70%, 60%, 0.8);
  margin-bottom: 0.5rem;
}

.noise-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.noise-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 0.7rem;
  background: hsla(0, 0%, 100%, 0.1);
  border: none;
  border-radius: 4px;
  color: hsla(0, 0%, 100%, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: line-through;
}

.noise-chip:hover {
  background: hsla(0, 0%, 100%, 0.2);
  color: hsla(0, 0%, 100%, 0.8);
  text-decoration: none;
}

/* 操作栏 */
.staging-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid hsla(45, 100%, 65%, 0.15);
}

.btn-gold {
  background: linear-gradient(135deg, hsl(40, 95%, 55%), hsl(25, 90%, 50%)) !important;
  border: none !important;
  color: hsl(30, 30%, 10%) !important;
  font-weight: 600;
  box-shadow: 0 4px 15px hsla(45, 100%, 60%, 0.4);
}

.btn-gold:hover:not(:disabled) {
  box-shadow: 0 6px 25px hsla(45, 100%, 60%, 0.6);
  transform: translateY(-1px);
}

.btn-gold:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 列表动画 */
.bubble-list-enter-active,
.bubble-list-leave-active {
  transition: all 0.3s ease;
}

.bubble-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.bubble-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.bubble-list-move {
  transition: transform 0.3s ease;
}
</style>