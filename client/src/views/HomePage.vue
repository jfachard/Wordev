<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { User, Calendar, Swords, Trophy } from '@lucide/vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const cards = [
  { label: 'SOLO', desc: 'Infinite practice. No stakes.', highlight: false, icon: User, route: '/solo', comingSoon: false },
  { label: 'DAILY CHALLENGE', desc: 'The word of the day. One shot.', highlight: false, icon: Calendar, route: '/daily', comingSoon: false },
  { label: '1V1 VERSUS', desc: 'Race against another dev. Ranked.', highlight: true, icon: Swords, route: '/versus', comingSoon: true },
]
</script>

<template>
  <main class="flex flex-col items-center justify-center flex-1 px-4 py-8 md:px-8 md:py-12">
    <div class="w-full max-w-4xl space-y-8">
      <div class="space-y-3">
        <p v-if="userStore.user" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Welcome back, <span :style="{ color: 'var(--color-accent)' }">{{ userStore.user.username }}</span>
        </p>
        <h1 class="text-2xl font-bold md:text-4xl">Select Mode</h1>
        <p class="max-w-xl italic text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Select the game mode you want to play. Each mode offers a unique experience to help you sharpen your coding skills. Whether you prefer solo practice, daily challenges, or competitive 1v1 matches, there's something for everyone.
        </p>
      </div>

      <RouterLink
        to="/leaderboard"
        class="inline-flex items-center gap-2 text-sm uppercase tracking-widest transition-colors duration-200"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        <Trophy class="w-4 h-4" />
        Leaderboard
      </RouterLink>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RouterLink
          v-for="card in cards"
          :key="card.label"
          :to="card.route"
          class="rounded-xs p-8 flex flex-col gap-6 min-h-52 transition-colors duration-300"
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
          <ComingSoon v-if="card.comingSoon" class="mt-auto self-start" />
        </RouterLink>
      </div>
    </div>
  </main>
</template>
