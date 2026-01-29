<script setup lang="ts">
import { computed, ref } from "vue";
import { KeyRound, ServerCog, ShieldCheck } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
import Input from "@/components/ui/input/Input.vue";
import Badge from "@/components/ui/badge/Badge.vue";
import { useUiSettings } from "@/stores/useUiSettings";

const modelSource = ref("external");
const backendUrl = ref("http://127.0.0.1:8000");
const apiKey = ref("");
const samplesCollected = ref(18);
const samplesTarget = ref(50);
const isTraining = ref(false);
const uiSettings = useUiSettings();

const animationsEnabled = computed({
  get: () => uiSettings.animationsEnabled,
  set: (value: boolean) => uiSettings.setAnimationsEnabled(value),
});

const blurEnabled = computed({
  get: () => uiSettings.blurEnabled,
  set: (value: boolean) => uiSettings.setBlurEnabled(value),
});

const shadowEnabled = computed({
  get: () => uiSettings.shadowEnabled,
  set: (value: boolean) => uiSettings.setShadowEnabled(value),
});

// 🆕 Task 2 & 3: 记忆容量设置
const memoryLimit = computed({
  get: () => uiSettings.memoryLimit,
  set: (val: number) => uiSettings.setMemoryLimit(val),
});

const triggerTraining = () => {
  isTraining.value = true;
  window.setTimeout(() => {
    isTraining.value = false;
    samplesCollected.value = 0;
  }, 1500);
};
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">系统设置</p>
      <h1 class="mt-2 text-2xl font-semibold">模型与连接配置</h1>
      <p class="mt-2 text-sm text-zinc-400">选择你偏好的推理方式，灵活控制响应速度与隐私。</p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>模型来源</CardTitle>
        <CardDescription>外部云模型或本地 Python 服务。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <label class="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <input
            type="radio"
            name="modelSource"
            value="external"
            v-model="modelSource"
            class="mt-1"
          />
          <div>
            <p class="text-sm font-medium">外部 API (SiliconFlow / OpenAI)</p>
            <p class="text-xs text-zinc-400">云端大模型，响应迅速。</p>
          </div>
        </label>
        <label class="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <input
            type="radio"
            name="modelSource"
            value="local"
            v-model="modelSource"
            class="mt-1"
          />
          <div>
            <p class="text-sm font-medium">本地模型 (Python Backend)</p>
            <p class="text-xs text-zinc-400">本地推理，数据更安全。</p>
          </div>
        </label>
      </CardContent>
    </Card>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <KeyRound class="h-4 w-4" />
            API 配置
          </CardTitle>
          <CardDescription>仅在外部 API 模式下使用。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Input type="password" v-model="apiKey" placeholder="sk-..." />
          <Button class="w-full">保存 API Key</Button>
          <Badge variant="warning">未验证</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ServerCog class="h-4 w-4" />
            本地后端
          </CardTitle>
          <CardDescription>设置 Python 服务地址。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Input v-model="backendUrl" placeholder="http://127.0.0.1:8000" />
          <Button variant="outline" class="w-full">测试连接</Button>
          <Badge variant="success" class="flex w-fit items-center gap-2">
            <ShieldCheck class="h-3 w-3" />
            连接正常
          </Badge>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>训练状态</CardTitle>
        <CardDescription>每次选择都会写入训练集。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between text-sm text-zinc-300">
          <span>New samples collected</span>
          <span class="font-semibold">{{ samplesCollected }}/{{ samplesTarget }}</span>
        </div>
        <div class="h-2 w-full rounded-full bg-zinc-800">
          <div
            class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            :style="{ width: `${(samplesCollected / samplesTarget) * 100}%` }"
          />
        </div>
        <Button class="w-full" :disabled="isTraining" @click="triggerTraining">
          {{ isTraining ? "Evolving..." : "Evolve AI Now" }}
        </Button>
      </CardContent>
    </Card>
  </section>

  <section class="space-y-6">
    <header>
      <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">显示与性能</p>
      <h2 class="mt-2 text-xl font-semibold">视觉特效</h2>
      <p class="mt-2 text-sm text-zinc-400">可按需开启模糊与动效，默认关闭以保证帧率。</p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>特效开关</CardTitle>
        <CardDescription>按需开启不同层级的视觉效果。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <label class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div>
            <p class="text-sm font-medium">启用动画</p>
            <p class="text-xs text-zinc-400">包含打字机、渐变与过渡。</p>
          </div>
          <input type="checkbox" v-model="animationsEnabled" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div>
            <p class="text-sm font-medium">启用模糊</p>
            <p class="text-xs text-zinc-400">对输入框与侧边栏启用毛玻璃。</p>
          </div>
          <input type="checkbox" v-model="blurEnabled" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div>
            <p class="text-sm font-medium">启用阴影</p>
            <p class="text-xs text-zinc-400">恢复卡片与按钮阴影。</p>
          </div>
          <input type="checkbox" v-model="shadowEnabled" class="h-4 w-4" />
        </label>
      </CardContent>
    </Card>

    <!-- 🆕 Task 2 & 3: 记忆容量设置 -->
    <Card class="border-zinc-800 bg-zinc-900/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-xl">
          🧠 记忆容量 (Context Window)
        </CardTitle>
        <CardDescription>
          控制对话历史记录的最大消息数 (0-60 条)
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">当前上限</span>
            <span class="font-mono text-lg font-bold text-indigo-400">{{ memoryLimit }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="2"
            v-model.number="memoryLimit"
            class="w-full accent-indigo-500"
          />
          <div class="flex justify-between text-xs text-zinc-500">
            <span>0 (失忆模式)</span>
            <span>30 (推荐)</span>
            <span>60 (超长记忆)</span>
          </div>
        </div>
        
        <div v-if="memoryLimit > 30" class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p class="text-xs text-amber-300">
            ⚠️ 超过 30 条可能影响生成速度与 token 消耗
          </p>
        </div>
        
        <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p class="text-xs text-zinc-400 leading-relaxed">
            💡 <strong>灵活上限策略</strong>：当历史记录少于设定值时，自动使用全部记录。<br>
            例如：设置 10 条，但当前只有 3 条消息 → 实际发送 3 条。
          </p>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
