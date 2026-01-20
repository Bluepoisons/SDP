<script setup lang="ts">
import { computed, toRef, watch } from "vue";
import { useTypewriter } from "@/composables/useTypewriter";

const props = withDefaults(
  defineProps<{
    text: string;
    speed?: number;
    showCursor?: boolean;
  }>(),
  {
    speed: 30,
    showCursor: true,
  }
);

const emit = defineEmits<{
  (e: "tick"): void;
}>();

const textRef = toRef(props, "text");
const { displayedText, isComplete } = useTypewriter(textRef, props.speed);

watch(displayedText, () => {
  emit("tick");
});

const caretVisible = computed(() => props.showCursor && !isComplete.value);
</script>

<template>
  <span>
    {{ displayedText }}
    <span v-if="caretVisible" class="ml-1 inline-block w-2 animate-pulse">|</span>
  </span>
</template>