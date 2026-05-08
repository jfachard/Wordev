<script setup lang="ts">
import { watch } from 'vue'
import { toast } from 'vue3-toastify'
import { useGameStore } from '@/stores/game'

const game = useGameStore()
const LENGTH_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

watch(() => game.phase, (newPhase, oldPhase) => {
  if (newPhase === 'playing' && oldPhase === 'setup') {
    toast('Game started! Good luck!', { type: 'info' })
  } else if (newPhase === 'won') {
    const count = game.guesses.length
    toast(`You got it in ${count} ${count === 1 ? 'guess' : 'guesses'}!`, { type: 'success' })
  } else if (newPhase === 'lost') {
    toast(`The word was "${game.revealedWord?.toUpperCase()}"`, { type: 'error', autoClose: 5000 })
  }
})
</script>

<template>
  <!-- SETUP -->
  <main v-if="game.phase === 'setup'" class="flex flex-col items-center justify-center flex-1 px-4 py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="space-y-2">
        <span
          v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400 } }"
          class="block text-sm uppercase tracking-widest"
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
          @click="game.selectedLength = n"
          class="w-12 h-12 font-bold rounded-xs transition-colors duration-150 cursor-pointer"
          :style="{
            backgroundColor: game.selectedLength === n ? 'var(--color-accent)' : 'var(--color-surface)',
            color: game.selectedLength === n ? 'var(--color-accent-dark)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }"
        >{{ n }}</button>
        <button
          @click="game.selectedLength = null"
          class="px-4 h-12 font-bold text-sm rounded-xs transition-colors duration-150 cursor-pointer"
          :style="{
            backgroundColor: game.selectedLength === null ? 'var(--color-accent)' : 'var(--color-surface)',
            color: game.selectedLength === null ? 'var(--color-accent-dark)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }"
        >Random</button>
      </div>

      <p v-if="game.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">{{ game.error }}</p>

      <button
        v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400, delay: 320 } }"
        @click="game.startGame()"
        class="px-8 py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Start Game</button>
    </div>
  </main>

  <!-- GAME -->
  <main v-else class="flex flex-col items-center gap-5 px-4 py-6">

    <GameGrid
      :guesses="game.guesses"
      :revealing-guess="game.revealingGuess"
      :revealed-tiles="game.revealedTiles"
      :current-input="game.currentInput"
      :word-length="game.wordLength"
      :phase="game.phase"
    />

    <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
      <template v-if="game.phase === 'playing'">
        {{ game.attemptsLeft }} attempt{{ game.attemptsLeft === 1 ? '' : 's' }} left
      </template>
    </p>

    <GameHint
      v-if="game.phase === 'playing'"
      :hints-left="game.hintsLeft"
      :hints="game.hints"
      :loading="game.isHinting"
      @request="game.requestHint()"
    />

    <p v-if="game.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">{{ game.error }}</p>

    <div
      v-if="game.phase === 'won' || game.phase === 'lost'"
      v-motion :initial="{ opacity: 0, y: -10 }" :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      class="text-center space-y-3"
    >
      <p v-if="game.phase === 'won'" class="font-bold text-lg" :style="{ color: 'var(--color-correct)' }">
        You got it in {{ game.guesses.length }} {{ game.guesses.length === 1 ? 'guess' : 'guesses' }}!
      </p>
      <p v-else class="font-bold text-lg">
        The word was <span :style="{ color: 'var(--color-accent)' }">{{ game.revealedWord }}</span>
      </p>
      <button
        @click="game.phase = 'setup'"
        class="px-6 py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Play Again</button>
    </div>

    <GameKeyboard
      v-if="game.phase === 'playing'"
      :letter-colors="game.letterColors"
      :active="game.phase === 'playing'"
      @letter="game.addLetter"
      @submit="game.submitGuess"
      @backspace="game.removeLetter"
    />

  </main>
</template>
