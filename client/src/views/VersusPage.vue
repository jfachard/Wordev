<script setup lang="ts">
import { Swords } from '@lucide/vue'
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-4xl space-y-4">
      <div class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
        <Swords class="w-5 h-5" />
        <span class="text-sm  uppercase tracking-widest">1v1 Versus</span>
      </div>
      <h1 class="text-4xl font-bold">Race to Win</h1>
      <p :style="{ color: 'var(--color-text-muted)' }">Ranked. Real-time. No mercy.</p>
    </div>
  </main>
</template>
