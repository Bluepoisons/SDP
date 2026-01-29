<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

/**
 * 🎬 打字机效果组件 - GALGAME 风格文字演出
 * 
 * Props:
 * - text: 要显示的文本
 * - speed: 打字速度（毫秒/字符）
 * - autoStart: 是否自动开始
 * - playSound: 是否播放音效
 * 
 * Events:
 * - complete: 打字完成
 * - skip: 用户快进
 */

const props = withDefaults(defineProps<{
  text: string;
  speed?: number;
  autoStart?: boolean;
  playSound?: boolean;
  class?: string;
}>(), {
  speed: 50,
  autoStart: true,
  playSound: false,
  class: ''
});

const emit = defineEmits<{
  complete: [];
  skip: [];
}>();

const displayText = ref('');
const isTyping = ref(false);
const showCursor = ref(true);
const currentIndex = ref(0);
let typeTimer: number | null = null;

// 🎵 打字音效（使用 Web Audio API 生成简单音效）
const playTypeSound = () => {
  if (!props.playSound) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Silently fail if audio not supported
  }
};

// 📝 开始打字
const startTyping = () => {
  if (isTyping.value) return;
  
  isTyping.value = true;
  currentIndex.value = 0;
  displayText.value = '';
  
  const typeNextChar = () => {
    if (currentIndex.value < props.text.length) {
      displayText.value += props.text[currentIndex.value];
      currentIndex.value++;
      
      // 播放音效（跳过空格和标点）
      const char = props.text[currentIndex.value - 1];
      if (char && char.trim() && !/[，。！？、,.!?]/.test(char)) {
        playTypeSound();
      }
      
      typeTimer = window.setTimeout(typeNextChar, props.speed);
    } else {
      finishTyping();
    }
  };
  
  typeNextChar();
};

// ✅ 完成打字
const finishTyping = () => {
  isTyping.value = false;
  showCursor.value = false;
  if (typeTimer) {
    clearTimeout(typeTimer);
    typeTimer = null;
  }
  emit('complete');
};

// ⏩ 快进/跳过
const skip = () => {
  if (isTyping.value) {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
    displayText.value = props.text;
    finishTyping();
    emit('skip');
  }
};

// 🎯 监听文本变化
watch(() => props.text, () => {
  if (props.autoStart) {
    startTyping();
  }
}, { immediate: props.autoStart });

// 🖱️ 点击快进
const handleClick = () => {
  if (isTyping.value) {
    skip();
  }
};

onMounted(() => {
  // 监听空格键快进
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === 'Space' && isTyping.value) {
      e.preventDefault();
      skip();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
    if (typeTimer) {
      clearTimeout(typeTimer);
    }
  });
});

// 暴露方法给父组件
defineExpose({
  startTyping,
  skip,
  isTyping
});
</script>

<template>
  <span 
    :class="['text-dialogue typewriter-text', props.class]"
    @click="handleClick"
  >
    {{ displayText }}
    <span 
      v-if="showCursor && isTyping" 
      class="typewriter-cursor"
    ></span>
    <span v-if="!isTyping" class="opacity-0">|</span>
  </span>
</template>

<style scoped>
.typewriter-text {
  cursor: pointer;
  user-select: none;
}

.typewriter-text:hover {
  opacity: 0.8;
}
</style>
