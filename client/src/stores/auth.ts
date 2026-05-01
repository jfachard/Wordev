import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

interface User {
  email: string
  username?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  const register = async (email: string, password: string, username: string) => {
    const response = await api.post('/auth/register', {
      email,
      passwordHash: password,
      username,
    })
    accessToken.value = response.data.accessToken
    user.value = { email, username }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      passwordHash: password,
    })
    accessToken.value = response.data.accessToken
    refreshToken.value = response.data.refreshToken
    localStorage.setItem('refreshToken', response.data.refreshToken)
    user.value = { email, username: response.data.username }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const logout = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
  }

  return { user, accessToken, refreshToken, isAuthenticated, register, login, logout }
})
