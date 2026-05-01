<script setup lang="ts">
import { User } from '@lucide/vue';
import { Calendar } from '@lucide/vue';
import { Swords } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const cards = [
  { label: 'SOLO', desc: 'Infinite practice. No stakes.', highlight: false, icon: User },
  { label: 'DAILY CHALLENGE', desc: 'The word of the day. One shot.', highlight: false, icon: Calendar },
  { label: '1V1 VERSUS', desc: 'Race against another dev. Ranked.', highlight: true, icon: Swords },
]
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-8 py-12">
    <div class="w-full max-w-4xl space-y-8">
      <div class="space-y-3">
        <p v-if="auth.user" class="text-sm font-mono" :style="{ color: 'var(--color-text-muted)' }">
          Welcome back, <span :style="{ color: 'var(--color-accent)' }">{{ auth.user.username }}</span>
        </p>
        <h1 class="text-4xl font-bold">Select Mode</h1>
        <p class="max-w-xl" :style="{ color: 'var(--color-text-muted)' }">
          Select the game mode you want to play. Each mode offers a unique experience to help you sharpen your coding skills. Whether you prefer solo practice, daily challenges, or competitive 1v1 matches, there's something for everyone.
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="card in cards"
          :key="card.label"
          class="rounded-xs p-8 flex flex-col gap-6 min-h-52 transition-colors duration-300 cursor-pointer"
          :style="{
            backgroundColor: card.highlight ? 'var(--color-accent)' : 'var(--color-surface)',
            color: card.highlight ? 'var(--color-accent-dark)' : 'var(--color-text)',
            border: `1px solid var(--color-border)`,
          }"
        >
          <component :is="card.icon" class="w-7 h-7" />
          <div class="space-y-2">
            <p class="font-bold text-base tracking-wide">{{ card.label }}</p>
            <p class="text-sm" :style="{ color: card.highlight ? 'var(--color-accent-dark)' : 'var(--color-text-muted)' }">
              {{ card.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
