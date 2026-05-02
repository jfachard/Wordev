<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LogOut, Menu, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const auth = useAuthStore()
const userStore = useUserStore()
const router = useRouter()
const menuOpen = ref(false)

function logout() {
  auth.logout()
  menuOpen.value = false
  router.push('/auth')
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 py-4 md:px-8"
    :style="{ borderBottom: '1px solid var(--color-border)' }"
  >
    <RouterLink to="/" class="font-bold tracking-widest text-lg" :style="{ color: 'var(--color-accent)' }">
      WORDEV
    </RouterLink>

    <!-- Desktop -->
    <div class="hidden md:flex items-center gap-6">
      <template v-if="auth.isAuthenticated">
        <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          {{ userStore.user?.username }}
        </span>
        <span class="text-sm" :style="{ color: 'var(--color-accent)' }">
          {{ userStore.user?.elo }} ELO
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

    <!-- Mobile -->
    <div class="flex md:hidden items-center gap-3">
      <ThemeToggle />
      <button @click="menuOpen = !menuOpen" :style="{ color: 'var(--color-text-muted)' }">
        <X v-if="menuOpen" class="w-5 h-5" />
        <Menu v-else class="w-5 h-5" />
      </button>
    </div>
  </header>

  <!-- Mobile menu -->
  <div
    v-if="menuOpen"
    class="md:hidden flex flex-col gap-4 px-4 py-5"
    :style="{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }"
  >
    <template v-if="auth.isAuthenticated">
      <div class="flex items-center justify-between">
        <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          {{ userStore.user?.username }}
        </span>
        <span class="text-sm" :style="{ color: 'var(--color-accent)' }">
          {{ userStore.user?.elo }} ELO
        </span>
      </div>
      <button
        @click="logout"
        class="flex items-center gap-2 text-sm  uppercase tracking-widest transition-colors duration-200"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        <LogOut class="w-4 h-4" />
        Logout
      </button>
    </template>
    <template v-else>
      <RouterLink
        to="/auth"
        @click="menuOpen = false"
        class="text-sm font-bold tracking-widest uppercase"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        LOGIN/REGISTER
      </RouterLink>
    </template>
  </div>
</template>
