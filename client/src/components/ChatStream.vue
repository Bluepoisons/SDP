<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import MessageBubble from "@/components/MessageBubble.vue";
import { useGameStore, type ChoiceOption } from "@/stores/useGameStore";

const gameStore = useGameStore();

// v9.0: 接收思考状态
const props = defineProps<{
  thinkingDuration?: number;
  thinkingStage?: string;
}>();

const messages = computed(() => gameStore.currentSession.messages);
const latestMessageId = computed(() => messages.value[messages.value.length - 1]?.id ?? "");
const scrollContainerRef = ref<HTMLElement | null>(null);

// 🎮 v9.2: 锚定用户输入 (Anchor Scroll)
const isAnchorMode = ref(false);       // 是否处于锚定模式（AI 正在输出时）
const anchorElement = ref<HTMLElement | null>(null);  // 锚定的用户消息元素
const userCanScroll = ref(true);       // 用户是否可以自由滚动
let rafId: number | null = null;

// 检测用户是否正在查看历史（用户主动向上滚）
const isUserScrollingUp = ref(false);
let lastScrollTop = 0;

const onScroll = () => {
  const container = scrollContainerRef.value;
  if (!container) return;
  
  const currentScrollTop = container.scrollTop;
  
  // 检测用户向上滚动的意图
  if (currentScrollTop < lastScrollTop - 10) {
    isUserScrollingUp.value = true;
  }
  
  // 如果滚动到底部附近，重置状态
  const { scrollHeight, clientHeight } = container;
  const distanceToBottom = scrollHeight - currentScrollTop - clientHeight;
  if (distanceToBottom < 50) {
    isUserScrollingUp.value = false;
  }
  
  lastScrollTop = currentScrollTop;
};

// 🎯 核心：滚动到锚点（用户最后一条消息）
const scrollToAnchor = async () => {
  await nextTick();
  const container = scrollContainerRef.value;
  if (!container) return;
  
  // 找到所有消息元素
  const messageElements = container.querySelectorAll('[data-message-id]');
  if (messageElements.length === 0) return;
  
  // 找到最后一条用户消息
  const allMessages = messages.value;
  let userMessageIndex = -1;
  for (let i = allMessages.length - 1; i >= 0; i--) {
    if (allMessages[i].role === 'user') {
      userMessageIndex = i;
      break;
    }
  }
  
  if (userMessageIndex >= 0 && messageElements[userMessageIndex]) {
    const userElement = messageElements[userMessageIndex] as HTMLElement;
    anchorElement.value = userElement;
    
    // 将用户消息滚动到视口顶部，留出 24px 呼吸空间
    const targetTop = userElement.offsetTop - 24;
    
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  } else {
    // 没有用户消息时，滚动到最后一条
    const lastElement = messageElements[messageElements.length - 1] as HTMLElement;
    lastElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// 检查锚点是否仍在视口内
const isAnchorInView = () => {
  const container = scrollContainerRef.value;
  const anchor = anchorElement.value;
  if (!container || !anchor) return true;
  
  const containerRect = container.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  
  // 锚点的底部还在视口内就算可见
  return anchorRect.bottom > containerRect.top && anchorRect.top < containerRect.bottom;
};

// 新消息到来时的滚动策略
const handleNewMessage = async () => {
  await nextTick();
  scrollToAnchor();
  isAnchorMode.value = true;
};

const emit = defineEmits<{
  (e: "regenerate", messageId: string): void;
  (e: "feedback", payload: { id: string; type: "like" | "dislike" | "reset" }): void;
  (e: "score-popup", score: number, x: number, y: number): void; // 🎨 v4.0: 属性弹窗事件
}>();

const handleSelect = (option: ChoiceOption) => {
  gameStore.handleOptionSelection(option);
};

const handleScorePopup = (score: number, x: number, y: number) => {
  emit("score-popup", score, x, y);
};

const handleRegenerate = (messageId: string) => {
  emit("regenerate", messageId);
};

const handleFeedback = (payload: { id: string; type: "like" | "dislike" | "reset" }) => {
  emit("feedback", payload);
};

const handleDelete = (messageId: string) => {
  gameStore.deleteMessage(messageId);
};

const handleTyping = () => {
  // 🎯 v9.2: 流式打字时的智能滚动
  // 只有当用户没有主动向上滚、且锚点已被顶出视口时，才缓慢跟随
  if (isUserScrollingUp.value) return;
  
  if (!isAnchorInView()) {
    // 锚点被顶出视口了，改为缓慢跟随底部
    const container = scrollContainerRef.value;
    if (container) {
      // 缓慢跟随，而不是瞬间跳到底部
      const targetTop = container.scrollHeight - container.clientHeight;
      const currentTop = container.scrollTop;
      const diff = targetTop - currentTop;
      
      // 每次只滚动差值的 30%，营造平滑跟随感
      if (diff > 10) {
        container.scrollTop = currentTop + diff * 0.3;
      }
    }
  }
  // 如果锚点还在视口内，不滚动，让用户看着 AI 在锚点下方打字
};

// v9.0: 暴露方法给父组件
defineExpose({
  scrollToBottom: scrollToAnchor,
});

onMounted(() => {
  scrollToAnchor();
  // 添加滚动监听
  scrollContainerRef.value?.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  scrollContainerRef.value?.removeEventListener('scroll', onScroll);
});

// 🎮 v9.2: 锚定滚动监听策略
// A. 监听消息数量增加：执行锚定滚动
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > (oldLen || 0)) {
    // 重置用户滚动状态
    isUserScrollingUp.value = false;
    handleNewMessage();
  }
});

// B. 流式打字时：不强制滚动，由 handleTyping 智能处理
// (移除对 content 的 watch，避免疯狂滚动)
</script>

<template>
  <!-- v9.1: 智能滚动容器 -->
  <div
    ref="scrollContainerRef"
    class="h-full overflow-y-auto px-2 pb-[50vh]"
    style="scrollbar-width: none; -ms-overflow-style: none;"
  >
    <!-- 🎮 P0: TransitionGroup 弹性入场 -->
    <TransitionGroup 
      name="message" 
      tag="div" 
      class="space-y-10"
    >
      <div
        v-for="message in messages"
        :key="message.id"
        :data-message-id="message.id"
      >
        <MessageBubble
          :message="message"
          :is-active="message.id === latestMessageId"
          :thinking-duration="message.type === 'thinking' ? props.thinkingDuration : undefined"
          :thinking-stage="message.type === 'thinking' ? props.thinkingStage : undefined"
          v-memo="[message.id, message.content, message.selectedOptionId, message.selectedText, message.feedback, message.type, message.burstComplete, props.thinkingDuration]"
          @select="handleSelect"
          @regenerate="handleRegenerate"
          @feedback="handleFeedback"
          @typing="handleTyping"
          @delete="handleDelete"
          @score-popup="handleScorePopup"
                />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 隐藏滚动条 */
div::-webkit-scrollbar {
  display: none;
}

/* 🎮 P0: 消息弹性入场动画 */
.message-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性贝塞尔 */
}

.message-enter-from {
  opacity: 0;
  transform: translateY(25px) scale(0.92);
}

/* 确保列表其他元素平滑让位 */
.message-move {
  transition: transform 0.4s ease;
}

/* 退出动画 */
.message-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.9);
}
</style>
