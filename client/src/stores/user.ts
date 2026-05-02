import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export interface User {
  email: string
  username: string
  elo: number
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))

  const fetchProfile = async () => {
    const response = await api.get('/users/me')
    user.value = {
      email: response.data.email,
      username: response.data.username,
      elo: response.data.elo,
    }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const clearUser = () => {
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, fetchProfile, clearUser }
})
