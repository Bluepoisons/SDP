<script setup lang="ts">
import { Camera, Crop, Sparkles } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardContent from "@/components/ui/card/CardContent.vue";

const steps = [
  "点击捕获按钮，立即进入截图模式",
  "拖拽选区定位对话文本",
  "自动识别并回填至对话面板",
];
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">屏幕捕获</p>
      <h1 class="mt-2 text-2xl font-semibold">截图与 OCR 工作流</h1>
      <p class="mt-2 text-sm text-zinc-400">一键截取对话框，快速进入智能分析。</p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Camera class="h-4 w-4" />
            捕获控制
          </CardTitle>
          <CardDescription>调用 Electron 截屏 API。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button class="w-full">
            <Camera class="h-4 w-4" />
            进入截图模式
          </Button>
          <Button variant="outline" class="w-full">
            <Crop class="h-4 w-4" />
            历史选区
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Sparkles class="h-4 w-4" />
            流程提示
          </CardTitle>
          <CardDescription>完整流程预览。</CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="space-y-3 text-sm text-zinc-300">
            <li v-for="step in steps" :key="step" class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              {{ step }}
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
