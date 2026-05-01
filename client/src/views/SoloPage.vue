<script setup lang="ts">
import { User } from '@lucide/vue'
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-4xl space-y-4">
      <div class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
        <User class="w-5 h-5" />
        <span class="text-sm font-mono uppercase tracking-widest">Solo</span>
      </div>
      <h1 class="text-4xl font-bold">Infinite Practice</h1>
      <p :style="{ color: 'var(--color-text-muted)' }">No stakes. Just you and the word.</p>
    </div>
  </main>
</template>
