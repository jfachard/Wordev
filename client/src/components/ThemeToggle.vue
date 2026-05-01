<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { Moon } from '@lucide/vue';
import { Sun } from '@lucide/vue';

const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    @click="toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="relative inline-flex h-7 w-14 items-center rounded-full border transition-colors duration-300 cursor-pointer"
    :style="{
      backgroundColor: isDark ? 'var(--color-surface-raised)' : 'var(--color-surface)',
      borderColor: 'var(--color-border)',
    }"
  >
    <span
      class="absolute flex h-5 w-5 items-center justify-center rounded-full text-xs transition-all duration-300"
      :style="{
        left: isDark ? 'calc(100% - 1.5rem)' : '0.25rem',
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-accent-dark)',
      }"
    >
      <component :is="isDark ? Moon : Sun" class="w-3 h-3" />
    </span>
  </button>
</template>
