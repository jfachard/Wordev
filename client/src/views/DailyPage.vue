<script setup lang="ts">
import { Calendar } from '@lucide/vue'
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-4xl space-y-4">
      <div class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
        <Calendar class="w-5 h-5" />
        <span class="text-sm uppercase tracking-widest">Daily Challenge</span>
      </div>
      <h1 class="text-4xl font-bold">Word of the Day</h1>
      <p :style="{ color: 'var(--color-text-muted)' }">One shot. Make it count.</p>
      <ComingSoon />
    </div>
  </main>
</template>
