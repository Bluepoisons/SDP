<script setup lang="ts">
import { computed, watch } from "vue";
import { useTextareaAutosize } from "@vueuse/core";
import Button from "@/components/ui/button/Button.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";

interface DestinyInputProps {
  modelValue: string;
  loading?: boolean;
  placeholder?: string;
  statusText?: string;
}

const props = withDefaults(defineProps<DestinyInputProps>(), {
  modelValue: "",
  loading: false,
  placeholder: "Enter the dialogue to weave destiny...",
  statusText: "Syncing with timeline...",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "generate"): void;
  (e: "cancel"): void;
  (e: "capture"): void;
  (e: "upload"): void;
}>();

const { textarea, input } = useTextareaAutosize({
  input: props.modelValue,
});

watch(
  () => props.modelValue,
  (value) => {
    if (value !== input.value) {
      input.value = value;
    }
  }
);

watch(input, (value) => emit("update:modelValue", value));

const isReady = computed(() => !props.loading && input.value.trim().length > 0);
</script>

<template>
  <div class="w-full">
    <p v-if="props.loading" class="mb-3 text-center text-xs tracking-[0.3em] text-muted">
      {{ props.statusText }}
    </p>

    <div class="relative rounded-2xl border border-white/10 border-t border-t-white/10 bg-[#09090b]/95 shadow-2xl shadow-black/50 transition-all duration-300 ease-out gpu-accelerated effects-blur">
      <div
        class="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent transition-opacity"
        :class="props.loading ? 'opacity-100 animate-pulse' : 'opacity-40'"
      ></div>
      <div class="flex items-end gap-4 px-6 py-5">
        <Textarea
          v-model="input"
          :textarea-ref="textarea"
          :placeholder="props.placeholder"
          class="min-h-[64px] w-full resize-none border-none bg-transparent text-lg tracking-wide text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0"
          :disabled="props.loading"
        />

        <div class="flex items-center gap-2">
          <Tooltip content="Capture Reality">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full border border-border/60 bg-transparent text-foreground/80 hover:bg-white/10"
              @click="emit('capture')"
            >
              📷
            </Button>
          </Tooltip>
          <Tooltip content="Upload Image">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full border border-border/60 bg-transparent text-foreground/80 hover:bg-white/10"
              @click="emit('upload')"
            >
              🖼️
            </Button>
          </Tooltip>

          <Tooltip :content="props.loading ? 'Cancel' : 'Generate'">
            <Button
              class="h-11 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-300 ease-out hover:scale-105"
              :disabled="!isReady && !props.loading"
              @click="props.loading ? emit('cancel') : emit('generate')"
            >
              <span v-if="!props.loading">Generate</span>
              <span v-else class="flex items-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Channeling
              </span>
            </Button>
          </Tooltip>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-white/10 px-6 py-2 text-xs text-zinc-500">
        <span>⌘ / Ctrl + Enter to cast</span>
        <span>{{ props.loading ? "Channeling..." : "Ready to weave destiny" }}</span>
      </div>
    </div>
  </div>
</template>
