<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Type, Check, Sparkles, Monitor } from 'lucide-vue-next';

/**
 * 🎨 v10.0 字体调谐器 - 二游风格字体选择
 * 支持场景自动切换 + 科技体/宋体增强
 */

const emit = defineEmits<{
  change: [font: string];
}>();

const props = defineProps<{
  modelValue?: string;
  scene?: 'dialogue' | 'narration' | 'system' | 'tactical';
}>();

// 🎯 增强字体列表
const fonts = [
  { 
    id: 'rounded', 
    name: '圆润体', 
    nameEn: 'Rounded',
    family: '"M PLUS Rounded 1c", "Noto Sans SC", sans-serif',
    sample: 'Aa',
    desc: '可爱圆润',
    category: 'dialogue',
    emotion: 'cute'
  },
  { 
    id: 'happy', 
    name: '欢喜体', 
    nameEn: 'KuaiLe',
    family: '"ZCOOL KuaiLe", "Noto Sans SC", cursive',
    sample: 'Aa',
    desc: '活泼手写',
    category: 'dialogue',
    emotion: 'happy'
  },
  { 
    id: 'noto', 
    name: '思源黑', 
    nameEn: 'Noto Sans',
    family: '"Noto Sans SC", "PingFang SC", sans-serif',
    sample: 'Aa',
    desc: '清晰现代',
    category: 'universal',
    emotion: 'neutral'
  },
  { 
    id: 'serif', 
    name: '宋体', 
    nameEn: 'Serif',
    family: '"Noto Serif SC", "Source Han Serif SC", "SimSun", serif',
    sample: 'Aa',
    desc: '古典优雅',
    category: 'narration',
    emotion: 'serious'
  },
  { 
    id: 'tech', 
    name: '科技体', 
    nameEn: 'Tech',
    family: '"Rajdhani", "Orbitron", "Noto Sans SC", sans-serif',
    sample: 'Aa',
    desc: '机械精密',
    category: 'system',
    emotion: 'cold'
  },
  { 
    id: 'mono', 
    name: '等宽体', 
    nameEn: 'Mono',
    family: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    sample: 'Aa',
    desc: '代码风格',
    category: 'tactical',
    emotion: 'analytical'
  },
];

// 场景推荐映射
const sceneRecommendations: Record<string, string> = {
  dialogue: 'rounded',
  narration: 'serif',
  system: 'tech',
  tactical: 'mono',
};

const selectedFont = ref(props.modelValue || 'rounded');

// 预览文本（根据类型变化）
const previewText = ref('呐，如果是你的话，一定可以做到的吧？');
const previewLines: Record<string, string[]> = {
  dialogue: [
    '呐，如果是你的话，一定可以做到的吧？',
    '我才不是因为担心你才来的呢！',
    '只要你还在，我就有勇气继续前进。',
    '这种事...果然还是不行啊...',
  ],
  narration: [
    '夕阳西下，少女的身影被拉得很长。',
    '命运的齿轮，在这一刻悄然转动。',
    '那是一段被遗忘在时光深处的故事。',
    '樱花飘落，如同她的泪水一般轻盈。',
  ],
  system: [
    'SYSTEM > 情报同步完成',
    'ALERT > 检测到异常心跳波动',
    'STATUS > 战术模块已加载',
    'SYNC > 建立神经连接中...',
  ],
  tactical: [
    '[分析] 好感度 +2，触发隐藏事件',
    '[预测] 选项A成功率: 78.3%',
    '[警告] 检测到关键分歧点',
    '[建议] 采用温柔路线进攻',
  ],
};

// 切换预览文本
let previewIndex = 0;
const cyclePreview = () => {
  const category = fonts.find(f => f.id === selectedFont.value)?.category || 'dialogue';
  const lines = previewLines[category] || previewLines.dialogue;
  previewIndex = (previewIndex + 1) % lines.length;
  previewText.value = lines[previewIndex];
};

// 获取当前选中字体的 family
const currentFontFamily = computed(() => {
  return fonts.find(f => f.id === selectedFont.value)?.family || fonts[0].family;
});

// 当前字体信息
const currentFont = computed(() => fonts.find(f => f.id === selectedFont.value));

// 场景推荐高亮
const isRecommended = (fontId: string) => {
  if (!props.scene) return false;
  return sceneRecommendations[props.scene] === fontId;
};

// 选择字体
const selectFont = (fontId: string) => {
  selectedFont.value = fontId;
  
  // 更新预览文本到对应类型
  const font = fonts.find(f => f.id === fontId);
  if (font) {
    const lines = previewLines[font.category] || previewLines.dialogue;
    previewIndex = 0;
    previewText.value = lines[0];
  }
  
  emit('change', fontId);
  
  // 应用到 CSS 变量
  document.documentElement.style.setProperty('--font-primary', currentFontFamily.value);
};

// 使用场景推荐
const useRecommendation = () => {
  if (props.scene && sceneRecommendations[props.scene]) {
    selectFont(sceneRecommendations[props.scene]);
  }
};

watch(() => props.modelValue, (val) => {
  if (val) selectedFont.value = val;
});

// 初始化时同步 CSS 变量
onMounted(() => {
  document.documentElement.style.setProperty('--font-primary', currentFontFamily.value);
});
</script>

<template>
  <div class="font-tuner">
    <!-- 🎯 场景推荐提示 -->
    <div v-if="scene" class="scene-hint">
      <Monitor class="w-4 h-4" />
      <span>当前场景: <strong>{{ scene }}</strong></span>
      <button class="use-recommend-btn" @click="useRecommendation">
        <Sparkles class="w-3 h-3" />
        使用推荐
      </button>
    </div>
    
    <!-- 🎨 字体选择网格 -->
    <div class="font-grid">
      <button
        v-for="font in fonts"
        :key="font.id"
        class="font-card"
        :class="{ 
          'is-selected': selectedFont === font.id,
          'is-recommended': isRecommended(font.id)
        }"
        @click="selectFont(font.id)"
      >
        <!-- 推荐标记 -->
        <div v-if="isRecommended(font.id)" class="recommend-badge">
          <Sparkles class="w-3 h-3" />
        </div>
        
        <!-- 字体预览 -->
        <div class="font-sample" :style="{ fontFamily: font.family }">
          {{ font.sample }}
        </div>
        
        <!-- 字体名称 -->
        <div class="font-info">
          <span class="font-name">{{ font.name }}</span>
          <span class="font-name-en">{{ font.nameEn }}</span>
        </div>
        
        <!-- 字体描述 -->
        <span class="font-desc">{{ font.desc }}</span>
        
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
        <span v-if="currentFont" class="preview-category">
          {{ currentFont.category }}
        </span>
        <span class="preview-hint">(点击切换)</span>
      </div>
      
      <div 
        class="preview-content"
        :style="{ fontFamily: currentFontFamily }"
        :class="{ 'tech-style': selectedFont === 'tech' || selectedFont === 'mono' }"
      >
        <p class="preview-text">{{ previewText }}</p>
        <p class="preview-text-sm">The quick brown fox jumps over the lazy dog.</p>
        <p class="preview-text-xs">0123456789 ♥ ✦ ★ ♪ ◆ ▸</p>
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

/* 🎯 场景提示 */
.scene-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(168, 85, 247, 0.08));
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.scene-hint strong {
  color: var(--theme-accent);
  text-transform: uppercase;
}

.use-recommend-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  color: var(--theme-accent);
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.use-recommend-btn:hover {
  background: var(--theme-accent);
  color: white;
}

/* 字体选择网格 */
.font-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .font-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.font-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 1rem 0.5rem 0.75rem;
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

.font-card.is-recommended {
  border-color: rgba(251, 191, 36, 0.4);
}

.font-card.is-recommended::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent);
  z-index: -1;
}

/* 推荐徽章 */
.recommend-badge {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  color: white;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8); }
}

.font-sample {
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--theme-text);
  line-height: 1;
}

.font-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.font-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--theme-text);
}

.font-name-en {
  font-size: 0.5rem;
  color: var(--theme-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.font-desc {
  font-size: 0.625rem;
  color: var(--theme-text-muted);
  opacity: 0;
  transition: opacity 0.2s;
}

.font-card:hover .font-desc {
  opacity: 1;
}

.selected-mark {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 1.125rem;
  height: 1.125rem;
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

.preview-category {
  padding: 0.125rem 0.5rem;
  background: rgba(var(--theme-accent-rgb, 34, 211, 238), 0.15);
  border-radius: 1rem;
  font-size: 0.625rem;
  color: var(--theme-accent);
  text-transform: uppercase;
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

.preview-content.tech-style {
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.03), transparent);
}

.preview-content.tech-style .preview-text {
  letter-spacing: 0.05em;
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
