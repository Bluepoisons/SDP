<script setup lang="ts">
import { onMounted, watch } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import { useUiSettings } from "@/stores/useUiSettings";

const uiSettings = useUiSettings();

onMounted(() => {
  document.body.classList.add("theme-dark");
  document.body.classList.remove("theme-light");
  document.body.classList.toggle("fx-anim-on", uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-anim-off", !uiSettings.animationsEnabled);
  document.body.classList.toggle("fx-blur-on", uiSettings.blurEnabled);
  document.body.classList.toggle("fx-blur-off", !uiSettings.blurEnabled);
  document.body.classList.toggle("fx-shadow-on", uiSettings.shadowEnabled);
  document.body.classList.toggle("fx-shadow-off", !uiSettings.shadowEnabled);
});

watch(
  () => [uiSettings.animationsEnabled, uiSettings.blurEnabled, uiSettings.shadowEnabled],
  ([anim, blur, shadow]) => {
    document.body.classList.toggle("fx-anim-on", anim);
    document.body.classList.toggle("fx-anim-off", !anim);
    document.body.classList.toggle("fx-blur-on", blur);
    document.body.classList.toggle("fx-blur-off", !blur);
    document.body.classList.toggle("fx-shadow-on", shadow);
    document.body.classList.toggle("fx-shadow-off", !shadow);
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0b] text-zinc-100">
    <AppLayout />
  </div>
</template>
