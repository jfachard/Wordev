import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken
    localStorage.setItem('accessToken', newAccessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  const register = async (email: string, password: string, username: string) => {
    const userStore = useUserStore()
    const response = await api.post('/auth/register', {
      email,
      passwordHash: password,
      username,
    })
    updateTokens(response.data.accessToken, response.data.refreshToken)
    await userStore.fetchProfile()
  }

  const login = async (email: string, password: string) => {
    const userStore = useUserStore()
    const response = await api.post('/auth/login', {
      email,
      passwordHash: password,
    })
    updateTokens(response.data.accessToken, response.data.refreshToken)
    await userStore.fetchProfile()
  }

  const logout = () => {
    const userStore = useUserStore()
    userStore.clearUser()
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { accessToken, refreshToken, isAuthenticated, updateTokens, register, login, logout }
})
