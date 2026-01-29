<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sun, Moon, Heart } from 'lucide-vue-next';

/**
 * 🎭 主题切换按钮 v5.0
 * 星之海 (Dark) ↔ 恋之毒 (Pink)
 */

const isPink = ref(false);

const toggleTheme = () => {
  isPink.value = !isPink.value;
  document.body.classList.toggle('theme-pink', isPink.value);
  
  // 保存到 localStorage
  localStorage.setItem('theme', isPink.value ? 'pink' : 'dark');
};

onMounted(() => {
  // 读取用户偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'pink') {
    isPink.value = true;
    document.body.classList.add('theme-pink');
  }
});
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :title="isPink ? '切换到星空模式' : '切换到粉色模式'"
  >
    <Transition name="rotate" mode="out-in">
      <Moon v-if="!isPink" class="h-4 w-4 text-cyan-400" />
      <Heart v-else class="h-4 w-4 text-pink-500 fill-current" />
    </Transition>
  </button>
</template>

<style scoped>
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
}

.rotate-enter-from {
  transform: rotate(-180deg) scale(0);
  opacity: 0;
}

.rotate-leave-to {
  transform: rotate(180deg) scale(0);
  opacity: 0;
}
</style>
