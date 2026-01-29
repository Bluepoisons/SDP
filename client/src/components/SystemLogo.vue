<script setup lang="ts">
/**
 * 🏷️ SystemLogo v6.0 - 图腾化品牌标识
 * Design: 几何图腾 + 宽体字体 + 版本号美学
 */

const VERSION = 'VER. 6.0.42';
const STATUS = 'BETA';
</script>

<template>
  <div class="system-logo group flex items-center gap-4">
    <!-- 🔷 几何图腾：数据流缠绕的心脏 -->
    <div class="sigil relative flex h-12 w-12 items-center justify-center">
      <!-- 外圈旋转环 -->
      <div class="absolute inset-0 rounded-full border-2 border-[var(--accent-color)] opacity-30 idle-breathe"></div>
      <div class="absolute inset-1 rounded-full border border-dashed border-[var(--accent-secondary)] opacity-20 animate-spin" style="animation-duration: 20s;"></div>
      
      <!-- 核心图腾 -->
      <svg 
        viewBox="0 0 40 40" 
        class="h-8 w-8 drop-shadow-lg"
        style="filter: drop-shadow(0 0 8px var(--glow-color));"
      >
        <!-- 心脏轮廓 -->
        <path 
          d="M20 35 C8 24 4 18 4 13 C4 8 8 4 13 4 C16 4 18 6 20 9 C22 6 24 4 27 4 C32 4 36 8 36 13 C36 18 32 24 20 35Z"
          fill="none"
          stroke="var(--accent-color)"
          stroke-width="1.5"
          class="idle-glow"
        />
        
        <!-- 数据流线条 -->
        <g stroke="var(--accent-secondary)" stroke-width="0.5" opacity="0.6">
          <line x1="10" y1="20" x2="30" y2="20">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="15" y1="15" x2="25" y2="25">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
          </line>
          <line x1="15" y1="25" x2="25" y2="15">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="0.6s" repeatCount="indefinite"/>
          </line>
        </g>
        
        <!-- 中心脉冲点 -->
        <circle cx="20" cy="18" r="3" fill="var(--accent-color)">
          <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
      
      <!-- 机械眼效果 (hover) -->
      <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div class="h-2 w-2 rounded-full bg-[var(--accent-color)] animate-ping"></div>
      </div>
    </div>

    <!-- 📛 品牌文字 -->
    <div class="flex flex-col">
      <!-- 主标题 -->
      <h1 
        class="text-xl font-bold tracking-[0.15em] text-[var(--bubble-text)]"
        style="font-family: var(--font-display);"
      >
        LOVE<span class="text-[var(--accent-color)]">_</span>ADVISOR
      </h1>
      
      <!-- 版本号 + 状态 -->
      <div class="flex items-center gap-2">
        <span class="deco-text text-[var(--accent-secondary)]">{{ VERSION }}</span>
        <span class="deco-text rounded border border-[var(--accent-color)] px-1 text-[var(--accent-color)]">
          {{ STATUS }}
        </span>
      </div>
    </div>

    <!-- 装饰性代码 -->
    <div class="ml-auto hidden items-center gap-2 opacity-30 lg:flex">
      <span class="deco-text">SYS.READY</span>
      <span class="deco-text text-[var(--accent-color)]">///</span>
      <span class="deco-text">NO.01</span>
    </div>
  </div>
</template>

<style scoped>
.system-logo {
  position: relative;
}

/* 下方装饰线 */
.system-logo::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    var(--accent-color) 0%,
    transparent 50%,
    var(--accent-secondary) 100%
  );
  opacity: 0.3;
}

/* 心跳模式：更柔和的 Logo */
:global(body.theme-heartbeat) .sigil {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14%, 42% { transform: scale(1.1); }
  28%, 70% { transform: scale(1.05); }
}
</style>
