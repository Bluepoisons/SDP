<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority";
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-800 text-zinc-100",
        secondary: "border-zinc-700 bg-zinc-900 text-zinc-300",
        success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

const props = defineProps<{
  variant?: BadgeVariants["variant"];
}>();

const attrs = useAttrs();

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), attrs.class));
</script>

<template>
  <div :class="classes" v-bind="attrs">
    <slot />
  </div>
</template>
