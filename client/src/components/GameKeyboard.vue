<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import type { LetterResult } from '@/types/game'

const props = defineProps<{
  letterColors: Record<string, LetterResult>
  active: boolean
}>()

const emit = defineEmits<{
  letter: [l: string]
  submit: []
  backspace: []
}>()

let kb: InstanceType<typeof Keyboard> | null = null

function updateTheme() {
  if (!kb) return
  const groups: Partial<Record<LetterResult, string[]>> = {}
  for (const [letter, result] of Object.entries(props.letterColors)) {
    if (!groups[result]) groups[result] = []
    groups[result]!.push(letter)
  }
  kb.setOptions({
    buttonTheme: (Object.entries(groups) as [LetterResult, string[]][]).map(([result, letters]) => ({
      class: `key-${result}`,
      buttons: letters.join(' '),
    })),
  })
}

watch(() => props.letterColors, updateTheme, { deep: true })

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

function onKeyboardRef(el: Element | null) {
  if (el instanceof HTMLElement) {
    kb?.destroy()
    kb = new Keyboard(el, {
      onKeyPress: (button: string) => {
        if (button === '{enter}') emit('submit')
        else if (button === '{bksp}') emit('backspace')
        else emit('letter', button)
      },
      layout: {
        default: [
          'Q W E R T Y U I O P',
          'A S D F G H J K L',
          '{enter} Z X C V B N M {bksp}',
        ],
      },
      display: { '{bksp}': '⌫', '{enter}': 'ENT' },
      theme: 'hg-theme-default wordev-keyboard',
      mergeDisplay: true,
      preventMouseDownDefault: true,
    })
  } else {
    kb?.destroy()
    kb = null
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  kb?.destroy()
})
</script>

<template>
  <div :ref="onKeyboardRef" class="w-full max-w-lg" />
</template>

<style scoped>
:deep(.wordev-keyboard) {
  background: transparent;
  padding: 0;
}
:deep(.wordev-keyboard .hg-row) {
  gap: 4px;
  margin-bottom: 4px;
}
:deep(.wordev-keyboard .hg-row:last-child) {
  margin-bottom: 0;
}
:deep(.wordev-keyboard .hg-button) {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: none;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  height: 54px;
  font-size: 0.85rem;
  transition: background-color 0.15s, color 0.15s;
}
:deep(.wordev-keyboard .hg-button:active) {
  background: var(--color-surface-raised);
}
:deep(.wordev-keyboard .hg-button[data-skbtn="{enter}"]),
:deep(.wordev-keyboard .hg-button[data-skbtn="{bksp}"]) {
  font-size: 0.75rem;
  flex-grow: 1.5;
}
:deep(.wordev-keyboard .hg-button.key-correct) {
  background: var(--color-correct);
  color: white;
  border-color: var(--color-correct);
}
:deep(.wordev-keyboard .hg-button.key-present) {
  background: var(--color-present);
  color: var(--color-accent-dark);
  border-color: var(--color-present);
}
:deep(.wordev-keyboard .hg-button.key-absent) {
  background: var(--color-absent);
  color: white;
  border-color: var(--color-absent);
}
</style>
