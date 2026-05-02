<script setup lang="ts">
import { Lightbulb } from '@lucide/vue';
defineProps<{
  hintsLeft: number
  hints: { position: number; letter: string }[]
  loading: boolean
}>()

defineEmits<{ request: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg">

    <div class="flex items-center justify-end w-full px-1">
      <button
        @click="$emit('request')"
        :disabled="hintsLeft === 0 || loading"
        class="flex px-1.5 py-1.5 text-xs uppercase tracking-widest rounded-xs transition-opacity duration-150"
        :style="{
          backgroundColor: 'var(--color-surface)',
          color: hintsLeft > 0 && !loading ? 'var(--color-text-muted)' : 'var(--color-border)',
          border: '1px solid var(--color-border)',
          cursor: hintsLeft > 0 && !loading ? 'pointer' : 'not-allowed',
          opacity: hintsLeft > 0 && !loading ? '1' : '0.5',
        }"
      >
        <Lightbulb class="w-4 h-4 mr-2" /> Hint ({{ hintsLeft }})
      </button>
    </div>

    <div v-if="hints.length > 0" class="flex flex-wrap gap-2 justify-center">
      <div
        v-for="(hint, i) in hints" :key="i"
        class="flex items-center gap-1 px-2 py-1 rounded-xs text-xs"
        :style="{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-present)',
        }"
      >
        <span :style="{ color: 'var(--color-text-muted)' }">pos {{ hint.position + 1 }}</span>
        <span class="font-bold" :style="{ color: 'var(--color-present)' }">{{ hint.letter }}</span>
      </div>
    </div>

  </div>
</template>
