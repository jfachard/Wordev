<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
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
