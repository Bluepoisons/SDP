<script setup lang="ts">
import { ref } from 'vue';
import { FastForward } from 'lucide-vue-next';

/**
 * ⏩ 快进按钮组件
 * 用于跳过打字机效果
 */

const emit = defineEmits<{
  skip: [];
}>();

const isActive = ref(false);

const handleClick = () => {
  isActive.value = true;
  emit('skip');
  
  setTimeout(() => {
    isActive.value = false;
  }, 300);
};
</script>

<template>
  <button
    class="fast-forward-btn"
    :class="{ active: isActive }"
    @click="handleClick"
    title="快进 (Space)"
  >
    <FastForward class="h-5 w-5 text-blue-300" />
  </button>
</template>
