<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Type, Check } from 'lucide-vue-next';

/**
 * 🎨 字体调谐器 - 二游风格字体选择
 * 带实时预览的字体切换组件
 */

const emit = defineEmits<{
  change: [font: string];
}>();

const props = defineProps<{
  modelValue?: string;
}>();

// 可用字体列表
const fonts = [
  { 
    id: 'rounded', 
    name: '圆润体', 
    nameEn: 'Rounded',
    family: '"M PLUS Rounded 1c", "Noto Sans SC", sans-serif',
    sample: 'Aa',
    desc: '可爱圆润'
  },
  { 
    id: 'happy', 
    name: '欢喜体', 
    nameEn: 'KuaiLe',
    family: '"ZCOOL KuaiLe", "Noto Sans SC", cursive',
    sample: 'Aa',
    desc: '活泼手写'
  },
  { 
    id: 'noto', 
    name: '思源黑', 
    nameEn: 'Noto Sans',
    family: '"Noto Sans SC", "PingFang SC", sans-serif',
    sample: 'Aa',
    desc: '清晰现代'
  },
  { 
    id: 'serif', 
    name: '宋体', 
    nameEn: 'Serif',
    family: '"Noto Serif SC", "SimSun", serif',
    sample: 'Aa',
    desc: '古典优雅'
  },
];

const selectedFont = ref(props.modelValue || 'rounded');

// 预览文本
const previewText = ref('呐，如果是你的话，一定可以做到的吧？');
const previewLines = [
  '呐，如果是你的话，一定可以做到的吧？',
  '我才不是因为担心你才来的呢！',
  '这个世界，需要你来拯救。',
  '只要你还在，我就有勇气继续前进。',
];

// 切换预览文本
let previewIndex = 0;
const cyclePreview = () => {
  previewIndex = (previewIndex + 1) % previewLines.length;
  previewText.value = previewLines[previewIndex];
};

// 获取当前选中字体的 family
const currentFontFamily = computed(() => {
  return fonts.find(f => f.id === selectedFont.value)?.family || fonts[0].family;
});

// 选择字体
const selectFont = (fontId: string) => {
  selectedFont.value = fontId;
  emit('change', fontId);
};

watch(() => props.modelValue, (val) => {
  if (val) selectedFont.value = val;
});
</script>

<template>
  <div class="font-tuner">
    <!-- 🎨 字体选择网格 -->
    <div class="font-grid">
      <button
        v-for="font in fonts"
        :key="font.id"
        class="font-card"
        :class="{ 'is-selected': selectedFont === font.id }"
        @click="selectFont(font.id)"
      >
        <!-- 字体预览 -->
        <div class="font-sample" :style="{ fontFamily: font.family }">
          {{ font.sample }}
        </div>
        
        <!-- 字体名称 -->
        <div class="font-info">
          <span class="font-name">{{ font.name }}</span>
          <span class="font-name-en">{{ font.nameEn }}</span>
        </div>
        
        <!-- 选中标记 -->
        <div v-if="selectedFont === font.id" class="selected-mark">
          <Check class="w-3 h-3" />
        </div>
      </button>
    </div>
    
    <!-- 📝 实时预览区 -->
    <div class="preview-area" @click="cyclePreview">
      <div class="preview-header">
        <Type class="w-4 h-4" />
        <span>实时预览 / Live Preview</span>
        <span class="preview-hint">(点击切换)</span>
      </div>
      
      <div 
        class="preview-content"
        :style="{ fontFamily: currentFontFamily }"
      >
        <p class="preview-text">{{ previewText }}</p>
        <p class="preview-text-sm">The quick brown fox jumps over the lazy dog.</p>
        <p class="preview-text-xs">0123456789 ♥ ✦ ★ ♪</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-tuner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 字体选择网格 */
.font-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.font-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.font-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.font-card.is-selected {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  border-color: var(--theme-accent);
  box-shadow: 0 0 20px var(--theme-glow);
}

.font-sample {
  font-size: 2rem;
  font-weight: 500;
  color: var(--theme-text);
  line-height: 1;
}

.font-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.font-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--theme-text);
}

.font-name-en {
  font-size: 0.625rem;
  color: var(--theme-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-mark {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-accent);
  border-radius: 50%;
  color: white;
}

/* 预览区 */
.preview-area {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.preview-area:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
}

.preview-hint {
  margin-left: auto;
  font-size: 0.625rem;
  opacity: 0.6;
}

.preview-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: font-family 0.3s ease;
}

.preview-text {
  font-size: 1.125rem;
  color: var(--theme-text);
  line-height: 1.6;
}

.preview-text-sm {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.preview-text-xs {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  letter-spacing: 0.1em;
}
</style>
