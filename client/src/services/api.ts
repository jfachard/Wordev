import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      // Refresh token is sent automatically via HttpOnly cookie
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )

      const { useAuthStore } = await import('@/stores/auth')
      useAuthStore().updateTokens(data.accessToken)

      original.headers.Authorization = `Bearer ${data.accessToken}`
      processQueue(null, data.accessToken)
      return api(original)
    } catch (err) {
      processQueue(err, null)
      forceLogout()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

function forceLogout() {
  localStorage.removeItem('accessToken')
  window.location.href = '/auth'
}

export default api
