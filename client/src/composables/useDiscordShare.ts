import { ref, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { postShareToDiscord } from '@/utils/share'

export function useDiscordShare() {
  const auth = useAuthStore()
  const discordConnected = ref(false)
  const discordShareState = ref<'idle' | 'sent'>('idle')

  onMounted(async () => {
    if (!auth.isAuthenticated) return
    try {
      const { data } = await api.get<{ connected: boolean }>('/users/me/discord')
      discordConnected.value = data.connected
    } catch {
      discordConnected.value = false
    }
  })

  async function shareToDiscord(gameId: string | null, shareText: string | null) {
    if (!gameId || !shareText) {
      toast('Could not share to Discord', { type: 'error' })
      return
    }
    try {
      await postShareToDiscord(gameId, shareText)
      discordShareState.value = 'sent'
      setTimeout(() => { discordShareState.value = 'idle' }, 2000)
    } catch {
      toast('Could not share to Discord', { type: 'error' })
    }
  }

  return { discordConnected, discordShareState, shareToDiscord }
}
