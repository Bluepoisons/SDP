<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ class?: string }>(), {
  class: "",
});

const classes = computed(() => `relative overflow-auto ${props.class}`.trim());
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
