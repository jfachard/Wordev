<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const auth = useAuthStore()
const userStore = useUserStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    userStore.fetchProfile()
  }
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col transition-colors duration-300"
    :style="{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }"
  >
    <Navbar />
    <RouterView />
  </div>
</template>
