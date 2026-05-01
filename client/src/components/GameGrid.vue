<script setup lang="ts">
import { computed } from 'vue'
import type { Guess, LetterResult, GamePhase } from '@/types/game'

type TileState = 'empty' | 'filled' | 'revealed' | 'revealing'
interface Tile { letter: string; result: LetterResult | null; state: TileState; index: number }

const props = withDefaults(defineProps<{
  guesses: Guess[]
  revealingGuess: Guess | null
  revealedTiles: Set<number>
  currentInput: string
  wordLength: number
  phase: GamePhase
  maxAttempts?: number
}>(), { maxAttempts: 6 })

const gridRows = computed((): Tile[][] => {
  const rows: Tile[][] = []

  for (const g of props.guesses) {
    rows.push(g.letters.map((l, i) => ({ letter: l, result: g.result[i], state: 'revealed', index: i })))
  }

  if (props.revealingGuess) {
    rows.push(props.revealingGuess.letters.map((l, i) => ({
      letter: l, result: props.revealingGuess!.result[i], state: 'revealing', index: i,
    })))
  } else if (props.phase === 'playing') {
    rows.push(Array.from({ length: props.wordLength }, (_, i) => ({
      letter: props.currentInput[i] ?? '', result: null,
      state: (props.currentInput[i] ? 'filled' : 'empty') as TileState, index: i,
    })))
  }

  while (rows.length < props.maxAttempts) {
    rows.push(Array.from({ length: props.wordLength }, (_, i) => ({
      letter: '', result: null, state: 'empty' as TileState, index: i,
    })))
  }

  return rows
})

const gridMaxWidth = computed(() => {
  if (props.wordLength <= 5) return '330px'
  if (props.wordLength <= 7) return '440px'
  return '580px'
})

function tileColor(state: TileState, result: LetterResult | null, isRevealed: boolean): string {
  const hasColor = state === 'revealed' || (state === 'revealing' && isRevealed)
  if (!hasColor) return 'var(--color-surface)'
  if (result === 'correct') return 'var(--color-correct)'
  if (result === 'present') return 'var(--color-present)'
  if (result === 'absent') return 'var(--color-absent)'
  return 'var(--color-surface)'
}

function tileFg(state: TileState, result: LetterResult | null, isRevealed: boolean): string {
  const hasColor = state === 'revealed' || (state === 'revealing' && isRevealed)
  if (!hasColor) return 'var(--color-text)'
  if (result === 'present') return 'var(--color-accent-dark)'
  return 'white'
}
</script>

<template>
  <div
    class="grid gap-1.5 w-full"
    :style="{ gridTemplateColumns: `repeat(${wordLength}, 1fr)`, maxWidth: gridMaxWidth }"
  >
    <template v-for="(row, rowIdx) in gridRows" :key="rowIdx">
      <div
        v-for="tile in row"
        :key="`${rowIdx}-${tile.index}`"
        class="tile font-bold uppercase flex items-center justify-center rounded-xs select-none"
        :class="{ 'tile-pop': tile.state === 'revealing' && revealedTiles.has(tile.index) }"
        :style="{
          backgroundColor: tileColor(tile.state, tile.result, revealedTiles.has(tile.index)),
          color: tileFg(tile.state, tile.result, revealedTiles.has(tile.index)),
          border: tile.state === 'filled' ? '2px solid var(--color-text-muted)' : '1px solid var(--color-border)',
          fontSize: wordLength > 7 ? '0.8rem' : '1rem',
        }"
      >{{ tile.letter }}</div>
    </template>
  </div>
</template>

<style scoped>
.tile {
  aspect-ratio: 1;
}

.tile-pop {
  animation: tilePop 0.3s ease forwards;
}

@keyframes tilePop {
  0%   { transform: scaleY(1); }
  30%  { transform: scaleY(0.05); }
  65%  { transform: scaleY(1.1); }
  100% { transform: scaleY(1); }
}
</style>
