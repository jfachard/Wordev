<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swords } from '@lucide/vue'
import { useVersusStore } from '@/stores/versus'

const router = useRouter()
const versus = useVersusStore()

onMounted(() => {
  versus.reset()
  versus.connect(() => router.push('/versus/game'))
})

onUnmounted(() => {
  if (versus.phase === 'queue') {
    versus.leaveQueue()
  }
})

function cancel() {
  versus.leaveQueue()
  router.push('/')
}
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-lg text-center">
      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
        class="flex flex-col items-center gap-8"
      >
        <!-- Pulsing icon -->
        <div class="relative">
          <div
            class="absolute inset-0 rounded-full animate-ping opacity-20"
            :style="{ backgroundColor: 'var(--color-accent)' }"
          />
          <div
            class="relative w-16 h-16 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <Swords class="w-7 h-7" :style="{ color: 'var(--color-accent)' }" />
          </div>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-bold">Looking for an opponent…</h1>
          <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
            Matchmaking in progress. This should only take a moment.
          </p>
        </div>

        <!-- Bouncing dots -->
        <div class="flex gap-2">
          <span
            v-for="i in 3"
            :key="i"
            class="w-2 h-2 rounded-full animate-bounce"
            :style="{
              backgroundColor: 'var(--color-accent)',
              animationDelay: `${(i - 1) * 0.15}s`,
            }"
          />
        </div>

        <!-- Connection status -->
        <p class="text-xs font-mono" :style="{ color: 'var(--color-text-muted)' }">
          <span v-if="versus.connectionStatus === 'connecting'">Connecting to server…</span>
          <span v-else-if="versus.connectionStatus === 'connected'">Connected — joining queue…</span>
          <span v-else-if="versus.connectionStatus === 'queued'">In queue — waiting for opponent…</span>
          <span v-else-if="versus.connectionStatus === 'error'" :style="{ color: 'var(--color-accent)' }">
            {{ versus.error || 'Connection error' }}
          </span>
        </p>

        <button
          @click="cancel"
          class="px-6 py-2.5 text-sm font-bold tracking-widest uppercase rounded-xs cursor-pointer transition-opacity hover:opacity-70"
          :style="{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }"
        >
          Cancel
        </button>
      </div>
    </div>
  </main>
</template>
