<script setup lang="ts">
import { computed, watch } from "vue";
import { useGameStore } from "@/stores/useGameStore";
import { useTypewriter } from "@/composables/useTypewriter";

const gameStore = useGameStore();

const messages = computed(() => gameStore.messages);

const latestAiMessage = computed(() => {
  return [...messages.value].reverse().find((msg) => msg.role === "ai");
});

const latestAiId = computed(() => latestAiMessage.value?.id ?? "");
const latestAiText = computed(() => latestAiMessage.value?.content ?? "");

const { displayedText, isComplete } = useTypewriter(latestAiText, 22);

watch(
  () => [latestAiId.value, isComplete.value],
  () => {
    gameStore.setTypingComplete(isComplete.value);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="message in messages"
      :key="message.id"
      class="flex w-full"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <div
        class="max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed"
        :class="message.role === 'user'
          ? 'bg-card/40 text-muted shadow-lg'
          : 'bg-card/60 text-foreground shadow-xl font-serif'
        "
      >
        <p v-if="message.role === 'ai' && message.id === latestAiId">
          {{ displayedText }}
        </p>
        <p v-else>
          {{ message.content }}
        </p>
      </div>
    </div>
  </div>
</template>
