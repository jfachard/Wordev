<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { X } from '@lucide/vue'

const STORAGE_KEY = 'wordev-tutorial-seen'

const open = ref(false)

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    open.value = true
  }
})

function close() {
  localStorage.setItem(STORAGE_KEY, '1')
  open.value = false
}

// Expose open so Navbar can trigger it
defineExpose({ show: () => { open.value = true } })

// Animated example: reveal tiles one by one
const EXAMPLE_WORD = 'REACT'
const EXAMPLE_GUESS = 'BREAK'
// R=present, E=correct, A=correct, K=absent, ...
// BREAK vs REACT:
// B -> absent
// R -> present (R is in REACT but not at pos 0)
// E -> correct (E at pos 1 in both)
// A -> correct (A at pos 2 in both)
// K -> absent
const EXAMPLE_RESULT = ['absent', 'present', 'correct', 'correct', 'absent']

const revealedCount = ref(0)
let revealInterval: ReturnType<typeof setInterval> | null = null

watch(open, (val) => {
  if (val) {
    revealedCount.value = 0
    revealInterval = setInterval(() => {
      if (revealedCount.value < EXAMPLE_WORD.length) {
        revealedCount.value++
      } else {
        clearInterval(revealInterval!)
      }
    }, 350)
  } else if (revealInterval) {
    clearInterval(revealInterval)
  }
})

const tileColors: Record<string, string> = {
  correct: 'var(--color-correct)',
  present: 'var(--color-present)',
  absent: 'var(--color-absent)',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.6)"
        @click.self="close"
      >
        <div
          class="w-full max-w-sm rounded-sm p-6 space-y-6 relative"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-lg tracking-wide uppercase dark:text-white">How to Play</h2>
            <button @click="close" :style="{ color: 'var(--color-text-muted)' }">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Rules -->
          <div class="space-y-3 text-sm" :style="{ color: 'var(--color-text-muted)' }">
            <p>
              Guess the <span :style="{ color: 'var(--color-text)' }" class="font-semibold">tech word</span>
              in <span :style="{ color: 'var(--color-text)' }" class="font-semibold">6 attempts</span>.
            </p>
            <p>
              Words come from the dev &amp; tech world — think
              <span :style="{ color: 'var(--color-text)' }">PUSH</span>,
              <span :style="{ color: 'var(--color-text)' }">FORK</span>,
              <span :style="{ color: 'var(--color-text)' }">PIXEL</span>,
              <span :style="{ color: 'var(--color-text)' }">CLOUD</span>…
            </p>
          </div>

          <!-- Animated example -->
          <div class="space-y-3">
            <p class="text-xs uppercase tracking-widest" :style="{ color: 'var(--color-text-muted)' }">Example</p>
            <div class="flex gap-1.5">
              <div
                v-for="(letter, i) in EXAMPLE_GUESS.split('')"
                :key="i"
                class="w-11 h-11 flex items-center justify-center font-bold text-sm rounded-xs transition-colors duration-300"
                :style="{
                  backgroundColor: revealedCount > i ? tileColors[EXAMPLE_RESULT[i] ?? 'absent'] : 'var(--color-surface)',
                  border: `2px solid ${revealedCount > i ? 'transparent' : 'var(--color-border)'}`,
                  color: revealedCount > i ? '#fff' : 'var(--color-text)',
                }"
              >{{ letter }}</div>
            </div>
          </div>

          <!-- Color legend -->
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded-xs shrink-0"
                style="background: var(--color-correct)"
              />
              <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
                <span :style="{ color: 'var(--color-text)' }" class="font-semibold">Correct</span> — right letter, right spot
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded-xs shrink-0"
                style="background: var(--color-present)"
              />
              <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
                <span :style="{ color: 'var(--color-text)' }" class="font-semibold">Present</span> — in the word, wrong spot
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded-xs shrink-0"
                style="background: var(--color-absent)"
              />
              <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
                <span :style="{ color: 'var(--color-text)' }" class="font-semibold">Absent</span> — not in the word
              </span>
            </div>
          </div>

          <button
            @click="close"
            class="w-full py-2.5 font-bold tracking-widest uppercase text-sm rounded-xs cursor-pointer"
            :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
          >Got it — Let's Play!</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
