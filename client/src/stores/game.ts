import { ref, computed, nextTick } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import type { Guess, LetterResult, GamePhase } from '@/types/game'

const MAX_ATTEMPTS = 6
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('setup')
  const selectedLength = ref<number | null>(null)
  const wordLength = ref(5)
  const gameId = ref<string | null>(null)
  const guesses = ref<Guess[]>([])
  const revealingGuess = ref<Guess | null>(null)
  const revealedTiles = ref<Set<number>>(new Set())
  const currentInput = ref('')
  const error = ref('')
  const isSubmitting = ref(false)
  const revealedWord = ref<string | null>(null)

  const letterColors = computed(() => {
    const priority: Record<LetterResult, number> = { correct: 2, present: 1, absent: 0 }
    const map: Record<string, LetterResult> = {}
    for (const g of guesses.value) {
      g.letters.forEach((l, i) => {
        const r = g.result[i]
        if (!map[l] || priority[r] > priority[map[l]]) map[l] = r
      })
    }
    return map
  })

  const attemptsLeft = computed(() => MAX_ATTEMPTS - guesses.value.length)

  function reset() {
    guesses.value = []
    revealingGuess.value = null
    revealedTiles.value = new Set()
    currentInput.value = ''
    revealedWord.value = null
    error.value = ''
    isSubmitting.value = false
  }

  async function startGame() {
    try {
      error.value = ''
      const body: { length?: number } = {}
      if (selectedLength.value !== null) body.length = selectedLength.value
      const res = await api.post('/games/solo/start', body)
      gameId.value = res.data.id
      wordLength.value = res.data.wordLength
      reset()
      phase.value = 'playing'
    } catch {
      error.value = 'Failed to start game. Try again.'
    }
  }

  async function submitGuess() {
    if (isSubmitting.value || !gameId.value || phase.value !== 'playing') return
    if (currentInput.value.length !== wordLength.value) {
      error.value = `Word must be ${wordLength.value} letters`
      return
    }
    error.value = ''
    isSubmitting.value = true
    try {
      const res = await api.post('/games/solo/guess', {
        gameId: gameId.value,
        guess: currentInput.value,
      })
      const letters: string[] = res.data.guess.split('')
      const result: LetterResult[] = res.data.result
      const isWon = result.every(r => r === 'correct')
      const isFinished = res.data.game.status === 'FINISHED'

      revealingGuess.value = { letters, result }
      const revealed = new Set<number>()
      await nextTick()

      for (let i = 0; i < wordLength.value; i++) {
        await sleep(150)
        revealed.add(i)
        revealedTiles.value = new Set(revealed)
      }
      await sleep(350)

      guesses.value.push({ letters, result })
      revealingGuess.value = null
      revealedTiles.value = new Set()
      currentInput.value = ''

      if (isFinished) {
        if (isWon) {
          phase.value = 'won'
        } else {
          const statusRes = await api.get(`/games/solo/${gameId.value}`)
          revealedWord.value = statusRes.data.word
          phase.value = 'lost'
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  function addLetter(l: string) {
    if (isSubmitting.value || currentInput.value.length >= wordLength.value) return
    currentInput.value += l
    error.value = ''
  }

  function removeLetter() {
    if (isSubmitting.value) return
    currentInput.value = currentInput.value.slice(0, -1)
  }

  return {
    phase, selectedLength, wordLength, gameId,
    guesses, revealingGuess, revealedTiles,
    currentInput, error, isSubmitting, revealedWord,
    letterColors, attemptsLeft,
    startGame, submitGuess, addLetter, removeLetter, reset,
  }
})
