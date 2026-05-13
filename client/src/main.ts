import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'

import GameGrid from './components/GameGrid.vue'
import GameHint from './components/GameHint.vue'
import GameKeyboard from './components/GameKeyboard.vue'
import Navbar from './components/Navbar.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import ComingSoon from './components/ComingSoon.vue'

import './index.css'
import 'vue3-toastify/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'top-center',
  pauseOnHover: true,
} as ToastContainerOptions)

app.component('GameGrid', GameGrid)
app.component('GameHint', GameHint)
app.component('GameKeyboard', GameKeyboard)
app.component('Navbar', Navbar)
app.component('ThemeToggle', ThemeToggle)
app.component('ComingSoon', ComingSoon)

app.mount('#app')
