<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import ScrollArea from "@/components/ui/scroll-area/ScrollArea.vue";
import MessageBubble from "@/components/MessageBubble.vue";
import { useGameStore, type ChoiceOption } from "@/stores/useGameStore";

const gameStore = useGameStore();

const messages = computed(() => gameStore.currentSession.messages);
const latestMessageId = computed(() => messages.value[messages.value.length - 1]?.id ?? "");
const scrollRef = ref<HTMLElement | null>(null);
const bottomRef = ref<HTMLElement | null>(null);
const isNearBottom = ref(true);
const nearBottomThreshold = 50;

const updateNearBottom = () => {
  if (!scrollRef.value) return;
  const target = scrollRef.value;
  const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
  isNearBottom.value = distance < nearBottomThreshold;
};

const scrollToBottom = async () => {
  await nextTick();
  if (!isNearBottom.value) return;
  if (scrollRef.value) {
    const items = scrollRef.value.querySelectorAll<HTMLElement>("[data-message-id]");
    const last = items[items.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
  if (bottomRef.value) {
    bottomRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
  scrollToBottom();
};

onMounted(scrollToBottom);
watch(messages, scrollToBottom, { deep: true });
</script>

<template>
  <ScrollArea class="h-full gpu-accelerated">
    <div
      ref="scrollRef"
      class="h-full overflow-auto px-2 pb-[50vh] scrollbar-hide scroll-optimized"
      @scroll="updateNearBottom"
    >
      <div class="space-y-10">
        <div
          v-for="message in messages"
          :key="message.id"
          :data-message-id="message.id"
        >
          <MessageBubble
            :message="message"
            :is-active="message.id === latestMessageId"
            v-memo="[message.id, message.content, message.selectedOptionId, message.selectedText, message.feedback, message.type]"
            @select="handleSelect"
            @regenerate="handleRegenerate"
            @feedback="handleFeedback"
            @typing="handleTyping"
            @delete="handleDelete"
            @score-popup="handleScorePopup"
          />
        </div>
        <div ref="bottomRef" class="h-px" />
      </div>
    </div>
  </ScrollArea>
</template>
