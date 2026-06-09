<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue3-toastify'
import { Calendar, Share2, Check, Timer } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { useGameStore } from '@/stores/game'

const game = useGameStore()
const countdown = ref('')
const shareState = ref<'idle' | 'copied'>('idle')
let countdownInterval: ReturnType<typeof setInterval> | null = null

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
  const result = await game.shareResult()
  if (result === 'copied') {
    shareState.value = 'copied'
    setTimeout(() => { shareState.value = 'idle' }, 2000)
  } else if (result === 'failed') {
    toast('Could not share result', { type: 'error' })
  }
}

watch(() => game.phase, (newPhase, oldPhase) => {
  if (newPhase === 'playing' && oldPhase === 'setup') {
    toast('Daily challenge started! One shot — make it count!', { type: 'info' })
  } else if (newPhase === 'won') {
    const count = game.guesses.length
    toast(`Daily word conquered in ${count} ${count === 1 ? 'guess' : 'guesses'}!`, { type: 'success' })
  } else if (newPhase === 'lost') {
    toast(`The word was "${game.revealedWord?.toUpperCase()}"`, { type: 'error', autoClose: 5000 })
  }
})

onMounted(() => {
  if (game.mode !== 'daily') {
    game.reset()
  }
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
      <div class="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span class="text-sm uppercase tracking-widest">Loading...</span>
    </div>
  </main>

  <!-- SETUP (hasn't played today) -->
  <main v-else-if="game.phase === 'setup'" class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="space-y-2">
        <div
          v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400 } }"
          class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }"
        >
          <Calendar class="w-5 h-5" />
          <span class="text-sm uppercase tracking-widest">Daily Challenge</span>
        </div>
        <h1
          v-motion :initial="{ opacity: 0, y: 20 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 80 } }"
          class="text-3xl font-bold"
        >Word of the Day</h1>
        <p
          v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 160 } }"
          class="text-sm" :style="{ color: 'var(--color-text-muted)' }"
        >One shot. Make it count.</p>
      </div>

      <p v-if="game.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">{{ game.error }}</p>

      <button
        v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400, delay: 240 } }"
        @click="game.startGame()"
        class="px-8 py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >Start Daily Challenge</button>

      <RouterLink
        v-if="game.isGuest"
        v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1, transition: { duration: 400, delay: 320 } }"
        to="/auth"
        class="block text-sm"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        Log in to track your stats &amp; play Versus &rarr;
      </RouterLink>
    </div>
  </main>

  <!-- ALREADY PLAYED (finished game, returning visit) -->
  <main v-else-if="game.phase === 'already_played'" class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-sm space-y-6 text-center">
      <div class="flex items-center justify-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
        <Calendar class="w-5 h-5" />
        <span class="text-sm uppercase tracking-widest">Daily Challenge</span>
      </div>


      <div v-if="game.alreadyPlayedData" class="space-y-1">
        <p v-if="game.alreadyPlayedData.won" class="text-xl font-bold" :style="{ color: 'var(--color-correct)' }">
          You won in {{ game.alreadyPlayedData.attempts }}/6!
        </p>
        <p v-else class="text-xl font-bold">
          Better luck tomorrow — <span :style="{ color: 'var(--color-accent)' }">{{ game.alreadyPlayedData.attempts }}/6</span>
        </p>
      </div>

      <pre
        v-if="dailyGrid"
        class="text-2xl leading-tight font-mono mx-auto"
        style="width: fit-content"
      >{{ dailyGrid }}</pre>

      <button
        v-if="game.dailyShareText"
        @click="share()"
        class="flex items-center gap-2 mx-auto px-6 py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer transition-colors duration-150"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >
        <Check v-if="shareState === 'copied'" class="w-4 h-4" />
        <Share2 v-else class="w-4 h-4" />
        {{ shareState === 'copied' ? 'Copied!' : 'Share Result' }}
      </button>

      <div class="flex items-center justify-center gap-2 text-sm" :style="{ color: 'var(--color-text-muted)' }">
        <Timer class="w-4 h-4" />
        <span>Next word in <span class="font-mono font-bold">{{ countdown }}</span></span>
      </div>
    </div>
  </main>

  <!-- GAME (playing, won, lost) -->
  <main v-else class="flex flex-col items-center gap-5 px-4 py-6">

    <div class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
      <Calendar class="w-4 h-4" />
      <span class="text-xs uppercase tracking-widest">Daily Challenge</span>
    </div>

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
      class="flex flex-col items-center gap-4 text-center"
    >
      <p v-if="game.phase === 'won'" class="font-bold text-lg" :style="{ color: 'var(--color-correct)' }">
        You got it in {{ game.guesses.length }} {{ game.guesses.length === 1 ? 'guess' : 'guesses' }}!
      </p>
      <p v-else class="font-bold text-lg">
        The word was <span :style="{ color: 'var(--color-accent)' }">{{ game.revealedWord }}</span>
      </p>

      <pre
        v-if="dailyGrid"
        class="text-2xl leading-tight font-mono"
        style="width: fit-content"
      >{{ dailyGrid }}</pre>

      <button
        v-if="game.dailyShareText"
        @click="share()"
        class="flex items-center gap-2 px-6 py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer transition-colors duration-150"
        :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
      >
        <Check v-if="shareState === 'copied'" class="w-4 h-4" />
        <Share2 v-else class="w-4 h-4" />
        {{ shareState === 'copied' ? 'Copied!' : 'Share Result' }}
      </button>

      <div class="flex items-center gap-2 text-sm" :style="{ color: 'var(--color-text-muted)' }">
        <Timer class="w-4 h-4" />
        <span>Next word in <span class="font-mono font-bold">{{ countdown }}</span></span>
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
