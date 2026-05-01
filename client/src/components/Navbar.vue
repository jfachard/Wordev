<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { LogOut } from '@lucide/vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/auth')
}
</script>

<template>
  <header
    class="flex items-center justify-between px-8 py-4"
    :style="{ borderBottom: '1px solid var(--color-border)' }"
  >
    <RouterLink to="/" class="font-bold tracking-widest text-lg" :style="{ color: 'var(--color-accent)' }">
      WORDEV
    </RouterLink>

    <div class="flex items-center gap-6">
      <template v-if="auth.isAuthenticated">
        <span class="text-sm font-mono" :style="{ color: 'var(--color-text-muted)' }">
          {{ auth.user?.username }}
        </span>
        <button @click="logout" class="flex items-center gap-1.5 transition-colors duration-200" :style="{ color: 'var(--color-text-muted)' }">
          <LogOut class="w-4 h-4" />
        </button>
      </template>
      <template v-else>
        <RouterLink
          to="/auth"
          class="text-sm font-bold tracking-widest uppercase transition-colors duration-200"
          :style="{ color: 'var(--color-text-muted)' }"
          active-class="!text-[var(--color-accent)]"
        >
          LOGIN/REGISTER
        </RouterLink>
      </template>
      <ThemeToggle />
    </div>
  </header>
</template>
