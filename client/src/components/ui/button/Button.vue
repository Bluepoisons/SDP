<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority";
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-red-500 text-white hover:bg-red-400",
        outline: "border border-border bg-transparent hover:bg-secondary/30",
        ghost: "bg-transparent hover:bg-secondary/30",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

const props = defineProps<{
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
}>();

const attrs = useAttrs();

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), attrs.class)
);
</script>

<template>
  <button :class="classes" v-bind="attrs">
    <slot />
  </button>
</template>
