<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Trophy } from '@lucide/vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const userStore = useUserStore()

interface LeaderboardEntry {
  rank: number
  username: string
  elo: number
  wins: number
  losses: number
}

interface Stats {
  username: string
  elo: number
  wins: number
  losses: number
  totalGames: number
  eloHistory: { eloAfter: number; createdAt: string }[]
}

const leaderboard = ref<LeaderboardEntry[]>([])
const stats = ref<Stats | null>(null)
const loading = ref(true)

onMounted(async () => {
  const [lbRes, statsRes] = await Promise.all([
    api.get('/leaderboard'),
    userStore.user?.id ? api.get(`/users/${userStore.user.id}/stats`) : Promise.resolve(null),
  ])
  leaderboard.value = lbRes.data
  if (statsRes) stats.value = statsRes.data
  loading.value = false
})

const chartData = computed(() => {
  const history = stats.value?.eloHistory ?? []
  return {
    labels: history.map((_, i) => `Game ${i + 1}`),
    datasets: [
      {
        data: history.map((h) => h.eloAfter),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 2,
        pointRadius: history.length <= 20 ? 4 : 2,
        pointBackgroundColor: '#f59e0b',
        tension: 0.3,
        fill: true,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#6b7280' } },
    y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#6b7280' } },
  },
}
</script>

<template>
  <main class="flex flex-col items-center flex-1 px-4 py-8 md:px-8 md:py-12">
    <div class="w-full max-w-4xl space-y-8">

      <!-- Header -->
      <div class="space-y-2">
        <div class="flex items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
          <Trophy class="w-5 h-5" />
          <span class="text-sm uppercase tracking-widest">Leaderboard</span>
        </div>
        <h1 class="text-3xl font-bold md:text-4xl">Top Players</h1>
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">The best devs, ranked by ELO.</p>
      </div>

      <div v-if="loading" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Loading…</div>

      <template v-else>

        <!-- Stats + Leaderboard -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">

          <!-- Stats card -->
          <div
            v-if="stats"
            class="rounded-xs p-6 space-y-4"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <p class="text-xs uppercase tracking-widest" :style="{ color: 'var(--color-text-muted)' }">Your Stats</p>
            <div class="space-y-3">
              <div>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">ELO</p>
                <p class="text-2xl font-bold" :style="{ color: 'var(--color-accent)' }">{{ stats.elo }}</p>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="text-lg font-bold" :style="{ color: 'var(--color-correct)' }">{{ stats.wins }}</p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Wins</p>
                </div>
                <div>
                  <p class="text-lg font-bold" :style="{ color: 'var(--color-accent)' }">{{ stats.losses }}</p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Losses</p>
                </div>
                <div>
                  <p class="text-lg font-bold">{{ stats.totalGames }}</p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Games</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Leaderboard table -->
          <div
            class="rounded-xs overflow-hidden md:col-span-2"
            :style="{ border: '1px solid var(--color-border)' }"
          >
            <table class="w-full text-sm">
              <thead>
                <tr :style="{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }">
                  <th class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-widest w-10"
                    :style="{ color: 'var(--color-text-muted)' }">#</th>
                  <th class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-widest"
                    :style="{ color: 'var(--color-text-muted)' }">Player</th>
                  <th class="px-4 py-3 text-right font-semibold text-xs uppercase tracking-widest"
                    :style="{ color: 'var(--color-text-muted)' }">ELO</th>
                  <th class="px-4 py-3 text-right font-semibold text-xs uppercase tracking-widest hidden sm:table-cell"
                    :style="{ color: 'var(--color-text-muted)' }">W</th>
                  <th class="px-4 py-3 text-right font-semibold text-xs uppercase tracking-widest hidden sm:table-cell"
                    :style="{ color: 'var(--color-text-muted)' }">L</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in leaderboard"
                  :key="entry.rank"
                  :style="{
                    backgroundColor: entry.username === userStore.user?.username
                      ? 'rgba(245,158,11,0.08)'
                      : 'var(--color-bg)',
                    borderBottom: '1px solid var(--color-border)',
                  }"
                >
                  <td class="px-4 py-3 font-mono tabular-nums text-xs"
                    :style="{ color: entry.rank <= 3 ? 'var(--color-accent)' : 'var(--color-text-muted)' }">
                    {{ entry.rank }}
                  </td>
                  <td class="px-4 py-3 font-semibold">
                    {{ entry.username }}
                    <span
                      v-if="entry.username === userStore.user?.username"
                      class="ml-2 text-xs px-1.5 py-0.5 rounded-xs font-bold"
                      :style="{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-dark)' }"
                    >You</span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-bold tabular-nums"
                    :style="{ color: 'var(--color-accent)' }">
                    {{ entry.elo }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums hidden sm:table-cell"
                    :style="{ color: 'var(--color-correct)' }">
                    {{ entry.wins }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono tabular-nums hidden sm:table-cell"
                    :style="{ color: 'var(--color-text-muted)' }">
                    {{ entry.losses }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ELO chart -->
        <div
          v-if="stats && stats.eloHistory.length > 0"
          class="rounded-xs p-6 space-y-4"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <p class="text-xs uppercase tracking-widest" :style="{ color: 'var(--color-text-muted)' }">
            ELO Progression
          </p>
          <div style="height: 220px">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <p
          v-else-if="stats && stats.eloHistory.length === 0"
          class="text-sm text-center"
          :style="{ color: 'var(--color-text-muted)' }"
        >
          Play some versus games to see your ELO progression here.
        </p>

      </template>
    </div>
  </main>
</template>
