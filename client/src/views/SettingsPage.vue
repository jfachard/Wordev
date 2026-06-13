<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

interface DiscordConnection {
  connected: boolean
  guildName: string | null
  channelName: string | null
  connectedAt: string | null
}

const route = useRoute()
const router = useRouter()

const discord = ref<DiscordConnection | null>(null)
const loading = ref(true)
const disconnecting = ref(false)
const statusMessage = ref<string | null>(null)

async function loadDiscord() {
  const { data } = await api.get<DiscordConnection>('/users/me/discord')
  discord.value = data
}

async function connectDiscord() {
  const { data } = await api.post<{ url: string }>('/auth/discord/start')
  window.location.href = data.url
}

async function disconnectDiscord() {
  disconnecting.value = true
  try {
    await api.delete('/users/me/discord')
    await loadDiscord()
    statusMessage.value = 'Discord disconnected.'
  } finally {
    disconnecting.value = false
  }
}

onMounted(async () => {
  await loadDiscord()
  loading.value = false

  const discordStatus = route.query.discord
  if (discordStatus === 'connected') {
    statusMessage.value = 'Discord connected!'
    await loadDiscord()
  } else if (discordStatus === 'error') {
    const reason = route.query.reason
    statusMessage.value =
      reason === 'access_denied'
        ? 'Discord connection cancelled.'
        : 'Failed to connect Discord.'
  }

  if (discordStatus) {
    router.replace({ path: '/settings' })
  }
})
</script>

<template>
  <main class="flex flex-col items-center flex-1 px-4 py-8 md:px-8 md:py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="space-y-2">
        <h1 class="text-2xl font-bold">Settings</h1>
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Manage your integrations.
        </p>
      </div>

      <p
        v-if="statusMessage"
        class="text-sm px-3 py-2 rounded-xs"
        :style="{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-accent)',
        }"
      >
        {{ statusMessage }}
      </p>

      <section
        class="rounded-xs p-6 space-y-4"
        :style="{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }"
      >
        <h2 class="font-bold tracking-wide">Discord</h2>
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Connect a channel to share your results directly on Discord.
        </p>

        <div v-if="loading" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Loading…
        </div>

        <template v-else-if="discord?.connected">
          <p class="text-sm">
            Connected to
            <span :style="{ color: 'var(--color-accent)' }">
              {{ discord.guildName ?? 'Server' }} / #{{ discord.channelName ?? 'channel' }}
            </span>
          </p>
          <button
            :disabled="disconnecting"
            class="text-sm uppercase tracking-widest transition-colors duration-200"
            :style="{ color: 'var(--color-text-muted)' }"
            @click="disconnectDiscord"
          >
            {{ disconnecting ? 'Disconnecting…' : 'Disconnect' }}
          </button>
        </template>

        <button
          v-else
          class="px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-xs transition-colors duration-200"
          :style="{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-dark)',
          }"
          @click="connectDiscord"
        >
          Connect Discord
        </button>

        <div
          class="pt-4 space-y-2 text-sm"
          :style="{ borderTop: '1px solid var(--color-border)' }"
        >
          <h3 class="font-bold tracking-wide">How to share on Discord</h3>
          <ol
            class="list-decimal list-inside space-y-1"
            :style="{ color: 'var(--color-text-muted)' }"
          >
            <li>
              Click <span :style="{ color: 'var(--color-accent)' }">Connect Discord</span>
              above and pick the server and channel where results should be posted.
            </li>
            <li>Authorize Wordev — Discord creates a webhook for that channel.</li>
            <li>Play and finish the Daily puzzle.</li>
            <li>
              On the result screen, hit
              <span :style="{ color: 'var(--color-accent)' }">Share to Discord</span>
              to post your grid in the channel.
            </li>
          </ol>
          <p :style="{ color: 'var(--color-text-muted)' }">
            Your username is added to the message so everyone knows who played.
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
