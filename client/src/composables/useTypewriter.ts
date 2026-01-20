import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";

export const useTypewriter = (text: Ref<string> | string, speed = 24) => {
  const source = computed(() => (typeof text === "string" ? text : text.value));
  const displayedText = ref("");
  const isComplete = ref(false);
  let rafId: number | null = null;
  let lastTime = 0;
  let index = 0;

  const cancelRaf = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const step = (time: number) => {
    if (!lastTime) lastTime = time;
    const delta = time - lastTime;
    if (delta >= speed) {
      lastTime = time;
      if (index < source.value.length) {
        index += 1;
        displayedText.value = source.value.slice(0, index);
      } else {
        isComplete.value = true;
        cancelRaf();
        return;
      }
    }
    rafId = requestAnimationFrame(step);
  };

  const start = () => {
    cancelRaf();
    displayedText.value = "";
    isComplete.value = false;
    lastTime = 0;
    index = 0;

    if (!source.value) {
      isComplete.value = true;
      return;
    }

    rafId = requestAnimationFrame(step);
  };

  watch(source, start, { immediate: true });
  onBeforeUnmount(cancelRaf);

  return { displayedText, isComplete };
};
