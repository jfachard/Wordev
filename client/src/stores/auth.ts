import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  const updateTokens = (newAccessToken: string) => {
    accessToken.value = newAccessToken
    localStorage.setItem('accessToken', newAccessToken)
  }

  const register = async (email: string, password: string, username: string) => {
    const userStore = useUserStore()
    const response = await api.post('/auth/register', { email, password, username })
    updateTokens(response.data.accessToken)
    await userStore.fetchProfile()
  }

  const login = async (email: string, password: string) => {
    const userStore = useUserStore()
    const response = await api.post('/auth/login', { email, password })
    updateTokens(response.data.accessToken)
    await userStore.fetchProfile()
  }

  const logout = async () => {
    const userStore = useUserStore()
    try {
      await api.post('/auth/logout')
    } catch {
      // best-effort — clear local state regardless
    }
    userStore.clearUser()
    accessToken.value = null
    localStorage.removeItem('accessToken')
  }

  const refreshViaCoookie = () =>
    axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )

  const initAuth = async () => {
    const userStore = useUserStore()
    if (accessToken.value) {
      try {
        await userStore.fetchProfile()
      } catch {
        // access token expired — try refresh via cookie
        try {
          const res = await refreshViaCoookie()
          updateTokens(res.data.accessToken)
          await userStore.fetchProfile()
        } catch {
          accessToken.value = null
          localStorage.removeItem('accessToken')
        }
      }
      return
    }
    // No access token — try refresh via HttpOnly cookie (returning user)
    try {
      const res = await refreshViaCoookie()
      updateTokens(res.data.accessToken)
      await userStore.fetchProfile()
    } catch {
      // Not logged in — guest mode
    }
  }

  return { accessToken, isAuthenticated, updateTokens, register, login, logout, initAuth }
})
