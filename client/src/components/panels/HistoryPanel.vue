<script setup lang="ts">
import { History, Inbox } from "lucide-vue-next";
import Card from "@/components/ui/card/Card.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">历史记录</p>
      <h1 class="mt-2 text-2xl font-semibold">对话追溯</h1>
      <p class="mt-2 text-sm text-zinc-400">保存每一次选择，持续优化你的表达风格。</p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <History class="h-4 w-4" />
          最近记录
        </CardTitle>
        <CardDescription>你还没有保存的对话记录。</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-400">
          <Inbox class="h-6 w-6" />
          暂无数据，生成第一条对话后即可在此查看。
        </div>
      </CardContent>
    </Card>
  </section>
</template>
