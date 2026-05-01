<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { LetterResult } from '@/types/game'

type Layout = 'qwerty' | 'azerty'

const LAYOUTS: Record<Layout, string[]> = {
  qwerty: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
  azerty: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'],
}

const props = defineProps<{
  letterColors: Record<string, LetterResult>
  active: boolean
}>()

const emit = defineEmits<{
  letter: [l: string]
  submit: []
  backspace: []
}>()

const layout = ref<Layout>('qwerty')
const rows = computed(() => LAYOUTS[layout.value])

function keyBg(letter: string): string {
  const r = props.letterColors[letter]
  if (r === 'correct') return 'var(--color-correct)'
  if (r === 'present') return 'var(--color-present)'
  if (r === 'absent') return 'var(--color-absent)'
  return 'var(--color-surface)'
}

function keyColor(letter: string): string {
  const r = props.letterColors[letter]
  if (r === 'present') return 'var(--color-accent-dark)'
  if (r === 'correct' || r === 'absent') return 'white'
  return 'var(--color-text)'
}

function keyShadow(letter: string): string {
  const r = props.letterColors[letter]
  if (r === 'correct') return '0 2px 0 color-mix(in srgb, var(--color-correct) 50%, black)'
  if (r === 'present') return '0 2px 0 color-mix(in srgb, var(--color-present) 50%, black)'
  if (r === 'absent') return '0 2px 0 color-mix(in srgb, var(--color-absent) 50%, black)'
  return '0 2px 0 var(--color-border)'
}

function onKeydown(e: KeyboardEvent) {
  if (!props.active) return
  if (e.ctrlKey || e.altKey || e.metaKey) return
  if (e.key === 'Enter') emit('submit')
  else if (e.key === 'Backspace') emit('backspace')
  else if (/^[a-zA-Z]$/.test(e.key)) emit('letter', e.key.toUpperCase())
}

watch(() => props.active, (active) => {
  if (active) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg select-none">

    <!-- Layout selector -->
    <div class="self-end">
      <select
        v-model="layout"
        class="text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-xs cursor-pointer outline-none"
        :style="{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }"
      >
        <option value="qwerty">QWERTY</option>
        <option value="azerty">AZERTY</option>
      </select>
    </div>

    <!-- Keys -->
    <div v-for="(row, i) in rows" :key="i" class="flex gap-1.5 justify-center w-full">

      <button
        v-if="i === 2"
        @click="emit('submit')"
        class="key key-fn font-bold uppercase tracking-wide"
        :style="{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          boxShadow: '0 2px 0 var(--color-border)',
          border: '1px solid var(--color-border)',
        }"
      >ENT</button>

      <button
        v-for="letter in row"
        :key="letter"
        @click="emit('letter', letter)"
        class="key font-bold uppercase"
        :style="{
          backgroundColor: keyBg(letter),
          color: keyColor(letter),
          boxShadow: keyShadow(letter),
          border: `1px solid ${props.letterColors[letter] ? keyBg(letter) : 'var(--color-border)'}`,
        }"
      >{{ letter }}</button>

      <button
        v-if="i === 2"
        @click="emit('backspace')"
        class="key key-fn font-bold"
        :style="{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          boxShadow: '0 2px 0 var(--color-border)',
          border: '1px solid var(--color-border)',
        }"
      >⌫</button>

    </div>
  </div>
</template>

<style scoped>
.key {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 40px;
  height: 56px;
  border-radius: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.08s ease, box-shadow 0.08s ease;
}

.key:hover {
  filter: brightness(1.1);
}

.key:active {
  transform: translateY(2px);
  box-shadow: none !important;
}

.key-fn {
  flex: 1.6;
  max-width: none;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

@media (max-width: 420px) {
  .key { height: 46px; font-size: 0.75rem; }
  .key-fn { font-size: 0.65rem; }
}
</style>
