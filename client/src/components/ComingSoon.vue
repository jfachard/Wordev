<script setup lang="ts">
import { Construction } from '@lucide/vue'

defineProps<{
  label?: string
}>()
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
    :style="{
      border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-muted)',
      boxShadow: '2px 2px 0 var(--color-border)',
    }"
  >
    <Construction class="w-3.5 h-3.5" :style="{ color: 'var(--color-accent)' }" />
    {{ label ?? 'Coming Soon' }}
  </div>
</template>
