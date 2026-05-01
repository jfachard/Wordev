<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Terminal, KeyRound, Eye, EyeOff, Mail, User } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const tab = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const error = ref<string | null>(null)
const loading = ref(false)

const form = ref({ email: '', username: '', password: '' })

async function submit() {
  error.value = null
  loading.value = true
  try {
    if (tab.value === 'login') {
      await auth.login(form.value.email, form.value.password)
    } else {
      await auth.register(form.value.email, form.value.password, form.value.username)
    }
    router.push('/')
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Authentication failed.'
  } finally {
    loading.value = false
  }
}

function switchTab(t: 'login' | 'register') {
  tab.value = t
  error.value = null
  form.value = { email: '', username: '', password: '' }
}
</script>

<template>
  <main
    class="flex flex-col items-center justify-center flex-1 px-4 py-12"
    :style="{ backgroundColor: 'var(--color-bg)' }"
  >
    <div
      class="w-full max-w-md rounded-xs p-8 space-y-6"
      :style="{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }"
    >
      <!-- Title -->
      <div class="space-y-1">
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">System Access</h1>
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Authenticate to compile your stats.
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex" :style="{ borderBottom: '1px solid var(--color-border)' }">
        <button
          v-for="t in (['login', 'register'] as const)"
          :key="t"
          @click="switchTab(t)"
          class="px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors duration-200"
          :style="{
            color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }"
        >
          {{ t }}
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-5">

        <!-- Developer Handle (register only) -->
        <div v-if="tab === 'register'" class="space-y-1.5">
          <label class="text-xs font-bold tracking-widest" :style="{ color: 'var(--color-text-muted)' }">
            DEVELOPER HANDLE
          </label>
          <div
            class="flex items-center gap-3 px-3 py-2.5 rounded-xs"
            :style="{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
            }"
          >
            <User class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" />
            <input
              v-model="form.username"
              type="text"
              placeholder="e.g. root_user"
              required
              class="flex-1 bg-transparent outline-none text-sm font-mono"
              :style="{ color: 'var(--color-text)' }"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold tracking-widest" :style="{ color: 'var(--color-text-muted)' }">
            {{ tab === 'login' ? 'DEVELOPER HANDLE' : 'EMAIL ADDRESS' }}
          </label>
          <div
            class="flex items-center gap-3 px-3 py-2.5 rounded-xs"
            :style="{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
            }"
          >
            <component :is="tab === 'login' ? Terminal : Mail" class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" />
            <input
              v-model="form.email"
              type="email"
              :placeholder="tab === 'login' ? 'e.g. root@wordev.io' : 'e.g. root@wordev.io'"
              required
              class="flex-1 bg-transparent outline-none text-sm font-mono"
              :style="{ color: 'var(--color-text)' }"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold tracking-widest" :style="{ color: 'var(--color-text-muted)' }">
              SECRET KEY
            </label>
            <a
              v-if="tab === 'login'"
              href="#"
              class="text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Forgot key?
            </a>
          </div>
          <div
            class="flex items-center gap-3 px-3 py-2.5 rounded-xs"
            :style="{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
            }"
          >
            <KeyRound class="w-4 h-4 shrink-0" :style="{ color: 'var(--color-text-muted)' }" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              minlength="8"
              class="flex-1 bg-transparent outline-none text-sm font-mono"
              :style="{ color: 'var(--color-text)' }"
            />
            <button type="button" @click="showPassword = !showPassword" class="shrink-0">
              <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" :style="{ color: 'var(--color-text-muted)' }" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 font-bold text-sm tracking-widest uppercase rounded-xs transition-opacity duration-200 cursor-pointer"
          :style="{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-dark)',
            opacity: loading ? '0.7' : '1',
          }"
        >
          {{ loading ? 'PROCESSING...' : tab === 'login' ? 'INITIALIZE SESSION →' : 'CREATE ACCOUNT →' }}
        </button>
      </form>

      <!-- Footer -->
      <p class="text-center text-xs" :style="{ color: 'var(--color-text-muted)' }">
        By authenticating, you agree to the Terms of Logic.
      </p>
    </div>

    <!-- Status bar -->
    <p class="mt-6 text-xs tracking-widest font-mono flex items-center gap-2" :style="{ color: 'var(--color-text-muted)' }">
      <span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
      AUTHENTICATION SERVER: ONLINE
    </p>
  </main>
</template>
