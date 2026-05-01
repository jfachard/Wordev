<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import GameGrid from '@/components/GameGrid.vue'
import GameKeyboard from '@/components/GameKeyboard.vue'
import api from '@/services/api'
import type { Guess, LetterResult, GamePhase } from '@/types/game'

const MAX_ATTEMPTS = 6
const LENGTH_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

const phase = ref<GamePhase>('setup')
const selectedLength = ref<number | null>(null)
const wordLength = ref(5)
const gameId = ref<string | null>(null)
const guesses = ref<Guess[]>([])
const revealingGuess = ref<Guess | null>(null)
const revealedTiles = ref<Set<number>>(new Set())
const currentInput = ref('')
const error = ref('')
const isSubmitting = ref(false)
const revealedWord = ref<string | null>(null)

const letterColors = computed(() => {
  const priority: Record<LetterResult, number> = { correct: 2, present: 1, absent: 0 }
  const map: Record<string, LetterResult> = {}
  for (const g of guesses.value) {
    g.letters.forEach((l, i) => {
      const r = g.result[i]
      if (!map[l] || priority[r] > priority[map[l]]) map[l] = r
    })
  }
  return map
})

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function startGame() {
  try {
    error.value = ''
    const body: { length?: number } = {}
    if (selectedLength.value !== null) body.length = selectedLength.value
    const res = await api.post('/games/solo/start', body)
    gameId.value = res.data.id
    wordLength.value = res.data.wordLength
    guesses.value = []
    revealingGuess.value = null
    revealedTiles.value = new Set()
    currentInput.value = ''
    revealedWord.value = null
    phase.value = 'playing'
  } catch {
    error.value = 'Failed to start game. Try again.'
  }
}

async function submitGuess() {
  if (isSubmitting.value || !gameId.value || phase.value !== 'playing') return
  if (currentInput.value.length !== wordLength.value) {
    error.value = `Word must be ${wordLength.value} letters`
    return
  }
  error.value = ''
  isSubmitting.value = true
  try {
    const res = await api.post('/games/solo/guess', {
      gameId: gameId.value,
      guess: currentInput.value,
    })
    const letters: string[] = res.data.guess.split('')
    const result: LetterResult[] = res.data.result
    const isWon = result.every(r => r === 'correct')
    const isFinished = res.data.game.status === 'FINISHED'

    revealingGuess.value = { letters, result }
    const revealed = new Set<number>()
    await nextTick()

    for (let i = 0; i < wordLength.value; i++) {
      await sleep(150)
      revealed.add(i)
      revealedTiles.value = new Set(revealed)
    }
    await sleep(350)

    guesses.value.push({ letters, result })
    revealingGuess.value = null
    revealedTiles.value = new Set()
    currentInput.value = ''

    if (isFinished) {
      if (isWon) {
        phase.value = 'won'
      } else {
        const statusRes = await api.get(`/games/solo/${gameId.value}`)
        revealedWord.value = statusRes.data.word
        phase.value = 'lost'
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Something went wrong'
  } finally {
    isSubmitting.value = false
  }
}

function addLetter(l: string) {
  if (isSubmitting.value || currentInput.value.length >= wordLength.value) return
  currentInput.value += l
  error.value = ''
}

function removeLetter() {
  if (isSubmitting.value) return
  currentInput.value = currentInput.value.slice(0, -1)
}
</script>

<template>
  <!-- SETUP -->
  <main v-if="phase === 'setup'" class="flex flex-col items-center justify-center flex-1 px-4 py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="space-y-2">
        <span
          v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400 } }"
          class="block text-sm font-mono uppercase tracking-widest"
          :style="{ color: 'var(--color-text-muted)' }"
        >Solo Mode</span>
        <h1
          v-motion :initial="{ opacity: 0, y: 20 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 80 } }"
          class="text-3xl font-bold"
        >Choose word length</h1>
        <p
          v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 160 } }"
          class="text-sm" :style="{ color: 'var(--color-text-muted)' }"
        >Pick a length from 4 to 10, or let us surprise you.</p>
      </div>

      <div
        v-motion :initial="{ opacity: 0, y: 12 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 240 } }"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="n in LENGTH_OPTIONS" :key="n"
          @click="selectedLength = n"
          class="w-12 h-12 font-bold font-mono rounded-xs transition-colors duration-150"
          :style="{
            backgroundColor: selectedLength === n ? 'var(--color-accent)' : 'var(--color-surface)',
            color: selectedLength === n ? 'var(--color-accent-dark)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }"
        >{{ n }}</button>
        <button
          @click="selectedLength = null"
          class="px-4 h-12 font-bold font-mono text-sm rounded-xs transition-colors duration-150"
          :style="{
            backgroundColor: selectedLength === null ? 'var(--color-accent)' : 'var(--color-surface)',
            color: selectedLength === null ? 'var(--color-accent-dark)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }"
        >Random</button>
      </div>

      <p v-if="error" class="text-sm font-mono" :style="{ color: 'var(--color-accent)' }">{{ error }}</p>

      <button
        v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400, delay: 320 } }"
        @click="startGame"
        class="px-8 py-3 font-bold tracking-widest uppercase text-sm rounded-xs"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Start Game</button>
    </div>
  </main>

  <!-- GAME -->
  <main v-else class="flex flex-col items-center gap-5 px-4 py-6">

    <GameGrid
      :guesses="guesses"
      :revealing-guess="revealingGuess"
      :revealed-tiles="revealedTiles"
      :current-input="currentInput"
      :word-length="wordLength"
      :phase="phase"
      :max-attempts="MAX_ATTEMPTS"
    />

    <p v-if="error" class="text-sm font-mono" :style="{ color: 'var(--color-accent)' }">{{ error }}</p>

    <div
      v-if="phase === 'won' || phase === 'lost'"
      v-motion :initial="{ opacity: 0, y: -10 }" :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      class="text-center space-y-3"
    >
      <p v-if="phase === 'won'" class="font-bold text-lg" :style="{ color: 'var(--color-correct)' }">
        You got it in {{ guesses.length }} {{ guesses.length === 1 ? 'guess' : 'guesses' }}!
      </p>
      <p v-else class="font-bold text-lg">
        The word was <span :style="{ color: 'var(--color-accent)' }">{{ revealedWord }}</span>
      </p>
      <button
        @click="phase = 'setup'"
        class="px-6 py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Play Again</button>
    </div>

    <GameKeyboard
      v-if="phase === 'playing'"
      :letter-colors="letterColors"
      :active="phase === 'playing'"
      @letter="addLetter"
      @submit="submitGuess"
      @backspace="removeLetter"
    />

  </main>
</template>
