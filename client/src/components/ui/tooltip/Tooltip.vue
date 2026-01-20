<script setup lang="ts">
import { computed, useAttrs } from "vue";
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "radix-vue";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

const props = withDefaults(defineProps<TooltipProps>(), {
  side: "top",
  sideOffset: 8,
});

const attrs = useAttrs();

const contentClasses = computed(() =>
  cn(
    "rounded-md border border-border/60 bg-background/90 px-3 py-1.5 text-xs text-foreground shadow-xl",
    attrs.class
  )
);
</script>

<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="props.side"
          :side-offset="props.sideOffset"
          :class="contentClasses"
        >
          {{ props.content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
