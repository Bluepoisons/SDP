<script setup lang="ts">
import type { Ref } from "vue";
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ modelValue?: string; textareaRef?: Ref<HTMLTextAreaElement | null> }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const attrs = useAttrs();
const classes = computed(() =>
  cn(
    "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
    attrs.class
  )
);

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <textarea
    :ref="props.textareaRef"
    :class="classes"
    :value="props.modelValue"
    v-bind="attrs"
    @input="onInput"
  />
</template>
