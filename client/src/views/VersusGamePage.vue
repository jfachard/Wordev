<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { Share2, Check } from '@lucide/vue'
import { useVersusStore } from '@/stores/versus'
import { socketService } from '@/services/socket'
import { buildShareText, shareOrCopy } from '@/utils/share'

const router = useRouter()
const versus = useVersusStore()
const shareState = ref<'idle' | 'copied'>('idle')

async function share() {
  const text = buildShareText({
    mode: 'versus',
    won: versus.iWon,
    guesses: versus.guesses,
  })
  const result = await shareOrCopy(text)
  if (result === 'copied') {
    shareState.value = 'copied'
    setTimeout(() => { shareState.value = 'idle' }, 2000)
  } else if (result === 'failed') {
    toast('Could not share result', { type: 'error' })
  }
}

onMounted(() => {
  if (!versus.gameId) {
    router.replace('/versus')
  }
})

const gridMaxWidth = computed(() => {
  if (versus.wordLength <= 5) return '330px'
  if (versus.wordLength <= 7) return '440px'
  return '580px'
})

onUnmounted(() => {
  socketService.disconnect()
})

function playAgain() {
  versus.reset()
  router.push('/versus')
}
</script>

<template>
  <main class="flex flex-col items-center gap-4 px-4 py-6">

    <!-- Header: my attempts vs opponent -->
    <div
      class="flex items-center justify-between w-full px-1 text-xs font-mono tabular-nums"
      :style="{ maxWidth: gridMaxWidth }"
    >
      <span :style="{ color: 'var(--color-text-muted)' }">
        Me &nbsp;{{ versus.guesses.length }}&thinsp;/&thinsp;6
      </span>
      <span class="uppercase tracking-widest text-xs" :style="{ color: 'var(--color-text-muted)' }">
        Versus
      </span>
      <span :style="{ color: 'var(--color-text-muted)' }">
        {{ versus.opponentUsername }} &nbsp;{{ versus.opponentAttempts }}&thinsp;/&thinsp;6
      </span>
    </div>

    <GameGrid
      :guesses="versus.guesses"
      :revealing-guess="versus.revealingGuess"
      :revealed-tiles="versus.revealedTiles"
      :current-input="versus.currentInput"
      :word-length="versus.wordLength"
      phase="playing"
    />

    <p v-if="versus.error" class="text-sm" :style="{ color: 'var(--color-accent)' }">
      {{ versus.error }}
    </p>

    <GameKeyboard
      v-if="versus.phase === 'playing'"
      :letter-colors="versus.letterColors"
      :active="versus.phase === 'playing'"
      @letter="versus.addLetter"
      @submit="versus.submitGuess"
      @backspace="versus.removeLetter"
    />

    <!-- Game over modal -->
    <Teleport to="body">
      <div
        v-if="versus.phase === 'game_over'"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        style="background: rgba(0,0,0,0.6)"
      >
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.92 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 300 } }"
          class="w-full max-w-sm rounded-sm p-8 space-y-6 text-center"
          :style="{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }"
        >
          <!-- Result -->
          <div class="space-y-1">
            <p
              v-if="versus.gameOverData?.disconnected"
              class="text-xs uppercase tracking-widest"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Opponent disconnected
            </p>
            <h2
              class="text-3xl font-bold"
              :style="{ color: versus.iWon ? 'var(--color-correct)' : 'var(--color-accent)' }"
            >
              {{ versus.iWon ? 'You Won!' : 'You Lost' }}
            </h2>
            <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
              The word was
              <span class="font-bold" :style="{ color: 'var(--color-text)' }">
                {{ versus.gameOverData?.word.toUpperCase() }}
              </span>
            </p>
          </div>

          <!-- ELO change -->
          <div
            v-if="versus.myElo"
            class="rounded-xs px-4 py-3 space-y-1"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <p class="text-xs uppercase tracking-widest" :style="{ color: 'var(--color-text-muted)' }">
              ELO
            </p>
            <p class="text-xl font-bold font-mono" :style="{ color: 'var(--color-accent)' }">
              {{ versus.myElo.eloBefore }}
              <span :style="{ color: 'var(--color-text-muted)' }">→</span>
              {{ versus.myElo.eloAfter }}
            </p>
            <p
              class="text-sm font-mono font-bold"
              :style="{ color: versus.myElo.eloDelta >= 0 ? 'var(--color-correct)' : 'var(--color-accent)' }"
            >
              {{ versus.myElo.eloDelta >= 0 ? '+' : '' }}{{ versus.myElo.eloDelta }}
            </p>
          </div>

          <div class="space-y-3">
            <button
              @click="share()"
              class="flex items-center justify-center gap-2 w-full py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
              :style="{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }"
            >
              <component :is="shareState === 'copied' ? Check : Share2" class="w-4 h-4" />
              {{ shareState === 'copied' ? 'Copied' : 'Share' }}
            </button>
            <div class="flex gap-3">
              <button
                @click="playAgain"
                class="flex-1 py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
                :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
              >
                Play Again
              </button>
              <button
                @click="router.push('/')"
                class="flex-1 py-3 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
                :style="{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </main>
</template>
