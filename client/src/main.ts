import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'

import GameGrid from './components/GameGrid.vue'
import GameHint from './components/GameHint.vue'
import GameKeyboard from './components/GameKeyboard.vue'
import Navbar from './components/Navbar.vue'
import ThemeToggle from './components/ThemeToggle.vue'

import './index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)

app.component('GameGrid', GameGrid)
app.component('GameHint', GameHint)
app.component('GameKeyboard', GameKeyboard)
app.component('Navbar', Navbar)
app.component('ThemeToggle', ThemeToggle)

app.mount('#app')
