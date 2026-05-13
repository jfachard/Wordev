<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue3-toastify'
import { Calendar, Share2, Clock } from '@lucide/vue'
import { useGameStore } from '@/stores/game'

const game = useGameStore()
const countdown = ref('')
let countdownInterval: ReturnType<typeof setInterval> | null = null

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
})

const gridMaxWidth = computed(() => {
  if (game.wordLength <= 5) return '330px'
  if (game.wordLength <= 7) return '440px'
  return '580px'
})

const dailyGrid = computed(() => game.dailyShareText?.split('\n\n')[1] ?? null)

function updateCountdown() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCHours(24, 0, 0, 0)
  const diff = tomorrow.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  countdown.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function share() {
  const ok = await game.shareResult()
  if (ok) toast('Result copied!', { type: 'success' })
  else toast('Could not copy to clipboard', { type: 'error' })
}

watch(() => game.phase, (newPhase, oldPhase) => {
  if (newPhase === 'playing' && oldPhase === 'setup') {
    toast('Daily started — one shot, make it count!', { type: 'info' })
  } else if (newPhase === 'won') {
    const count = game.guesses.length
    toast(`Daily word in ${count}/6!`, { type: 'success' })
  } else if (newPhase === 'lost') {
    toast(`The word was "${game.revealedWord?.toUpperCase()}"`, { type: 'error', autoClose: 5000 })
  }
})

onMounted(() => {
  game.mode = 'daily'
  game.checkDailyStatus()
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <!-- LOADING -->
  <main v-if="game.phase === 'loading'" class="flex flex-col items-center justify-center flex-1 px-4 py-12">
    <div class="flex flex-col items-center gap-4" :style="{ color: 'var(--color-text-muted)' }">
      <div class="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span class="text-xs uppercase tracking-widest">Checking today's challenge</span>
    </div>
  </main>

  <!-- SETUP (hasn't played today) -->
  <main v-else-if="game.phase === 'setup'" class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="space-y-3">
        <div
          v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400 } }"
          class="flex items-center gap-2"
          :style="{ color: 'var(--color-text-muted)' }"
        >
          <Calendar class="w-4 h-4" />
          <span class="text-xs uppercase tracking-widest">{{ todayLabel }}</span>
        </div>
        <h1
          v-motion :initial="{ opacity: 0, y: 20 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 80 } }"
          class="text-3xl font-bold"
        >Daily Challenge</h1>
        <p
          v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 160 } }"
          class="text-sm" :style="{ color: 'var(--color-text-muted)' }"
        >One word. One shot. Come back tomorrow for the next one.</p>
      </div>

      <p v-if="game.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">{{ game.error }}</p>

      <button
        v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400, delay: 240 } }"
        @click="game.startGame()"
        class="px-8 py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Start Today's Challenge</button>
    </div>
  </main>

  <!-- ALREADY PLAYED (returning visit after finishing) -->
  <main v-else-if="game.phase === 'already_played'" class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-sm flex flex-col items-center gap-6 text-center">

      <div class="flex items-center gap-2" :style="{ color: 'var(--color-text-muted)' }">
        <Calendar class="w-4 h-4" />
        <span class="text-xs uppercase tracking-widest">{{ todayLabel }}</span>
      </div>

      <div>
        <p
          class="text-4xl font-bold"
          :style="{ color: game.alreadyPlayedData?.won ? 'var(--color-correct)' : 'var(--color-text)' }"
        >{{ game.alreadyPlayedData?.attempts }}/6</p>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-muted)' }">
          {{ game.alreadyPlayedData?.won ? 'Got it!' : 'Better luck tomorrow.' }}
        </p>
      </div>

      <pre
        v-if="dailyGrid"
        class="text-2xl leading-snug font-mono"
        style="width: fit-content"
      >{{ dailyGrid }}</pre>

      <div class="flex flex-col items-center gap-3 w-full">
        <button
          v-if="game.dailyShareText"
          @click="share()"
          class="flex items-center justify-center gap-2 w-full max-w-xs py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
          :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
        >
          <Share2 class="w-4 h-4" />
          Share Result
        </button>

        <div class="flex items-center gap-2 text-sm" :style="{ color: 'var(--color-text-muted)' }">
          <Clock class="w-4 h-4" />
          <span>Next word in <span class="font-mono font-bold tabular-nums">{{ countdown }}</span></span>
        </div>
      </div>

    </div>
  </main>

  <!-- GAME (playing, won, lost) -->
  <main v-else class="flex flex-col items-center gap-4 px-4 py-6">

    <!-- Header: date + attempt counter -->
    <div
      class="flex items-center justify-between w-full px-1"
      :style="{ maxWidth: gridMaxWidth }"
    >
      <div class="flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
        <Calendar class="w-3.5 h-3.5" />
        <span class="text-xs uppercase tracking-widest">Daily</span>
      </div>
      <span class="text-xs font-mono tabular-nums" :style="{ color: 'var(--color-text-muted)' }">
        {{ game.guesses.length }}&thinsp;/&thinsp;6
      </span>
    </div>

    <GameGrid
      :guesses="game.guesses"
      :revealing-guess="game.revealingGuess"
      :revealed-tiles="game.revealedTiles"
      :current-input="game.currentInput"
      :word-length="game.wordLength"
      :phase="game.phase"
    />

    <GameHint
      v-if="game.phase === 'playing'"
      :hints-left="game.hintsLeft"
      :hints="game.hints"
      :loading="game.isHinting"
      @request="game.requestHint()"
    />

    <p v-if="game.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">{{ game.error }}</p>

    <!-- Result -->
    <div
      v-if="game.phase === 'won' || game.phase === 'lost'"
      v-motion :initial="{ opacity: 0, y: -10 }" :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      class="flex flex-col items-center gap-4 text-center"
    >
      <div>
        <p
          class="text-3xl font-bold"
          :style="{ color: game.phase === 'won' ? 'var(--color-correct)' : 'var(--color-text)' }"
        >{{ game.guesses.length }}/6</p>
        <p v-if="game.phase === 'won'" class="text-sm mt-1" :style="{ color: 'var(--color-text-muted)' }">
          Got it!
        </p>
        <p v-else class="text-sm mt-1" :style="{ color: 'var(--color-text-muted)' }">
          The word was
          <span class="font-bold" :style="{ color: 'var(--color-accent)' }">{{ game.revealedWord?.toUpperCase() }}</span>
        </p>
      </div>

      <div class="flex flex-col items-center gap-3">
        <button
          v-if="game.dailyShareText"
          @click="share()"
          class="flex items-center gap-2 px-6 py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
          :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
        >
          <Share2 class="w-4 h-4" />
          Share Result
        </button>

        <div class="flex items-center gap-2 text-sm" :style="{ color: 'var(--color-text-muted)' }">
          <Clock class="w-4 h-4" />
          <span>Next word in <span class="font-mono font-bold tabular-nums">{{ countdown }}</span></span>
        </div>
      </div>
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
