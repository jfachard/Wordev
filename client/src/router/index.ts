import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import AuthPage from '@/views/AuthPage.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/auth', component: AuthPage, meta: { guestOnly: true } },
    { path: '/solo', component: () => import('@/views/SoloPage.vue') },
    { path: '/daily', component: () => import('@/views/DailyPage.vue') },
    { path: '/versus', component: () => import('@/views/VersusPage.vue'), meta: { requiresAuth: true } },
    { path: '/versus/game', component: () => import('@/views/VersusGamePage.vue'), meta: { requiresAuth: true } },
    { path: '/leaderboard', component: () => import('@/views/LeaderboardPage.vue'), meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('@/views/SettingsPage.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/auth' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
