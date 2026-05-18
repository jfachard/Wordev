import { ref, computed, nextTick } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import type { Guess, LetterResult, GamePhase } from '@/types/game'

const MAX_ATTEMPTS = 6
const MAX_HINTS = 3
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('setup')
  const mode = ref<'solo' | 'daily'>('solo')
  const selectedLength = ref<number | null>(null)
  const wordLength = ref(5)
  const gameId = ref<string | null>(null)
  const guesses = ref<Guess[]>([])
  const revealingGuess = ref<Guess | null>(null)
  const revealedTiles = ref<Set<number>>(new Set())
  const currentInput = ref('')
  const error = ref('')
  const isSubmitting = ref(false)
  const isHinting = ref(false)
  const revealedWord = ref<string | null>(null)
  const hints = ref<{ position: number; letter: string }[]>([])
  const alreadyPlayedData = ref<{ won: boolean; attempts: number } | null>(null)
  const dailyShareText = ref<string | null>(null)

  const letterColors = computed(() => {
    const priority: Record<LetterResult, number> = { correct: 2, present: 1, absent: 0 }
    const map: Record<string, LetterResult> = {}
    for (const g of guesses.value) {
      g.letters.forEach((l, i) => {
        const r = g.result[i]!
        const current = map[l]
        if (!current || priority[r] > priority[current]) map[l] = r
      })
    }
    return map
  })

  const attemptsLeft = computed(() => MAX_ATTEMPTS - guesses.value.length)
  const hintsLeft = computed(() => MAX_HINTS - hints.value.length)

  function reset() {
    guesses.value = []
    revealingGuess.value = null
    revealedTiles.value = new Set()
    currentInput.value = ''
    revealedWord.value = null
    hints.value = []
    error.value = ''
    isSubmitting.value = false
    isHinting.value = false
  }

  async function startGame() {
    try {
      error.value = ''
      if (mode.value === 'daily') {
        const res = await api.post('/games/daily/start')
        gameId.value = res.data.gameId
        wordLength.value = res.data.wordLength
      } else {
        const body: { length?: number } = {}
        if (selectedLength.value !== null) body.length = selectedLength.value
        const res = await api.post('/games/solo/start', body)
        gameId.value = res.data.id
        wordLength.value = res.data.wordLength
      }
      reset()
      phase.value = 'playing'
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Failed to start game. Try again.'
    }
  }

  async function checkDailyStatus() {
    phase.value = 'loading'
    try {
      const res = await api.get('/games/daily/today')
      const data = res.data
      if (!data.hasPlayed) {
        phase.value = 'setup'
        return
      }
      if (data.status === 'ACTIVE') {
        gameId.value = data.gameId
        wordLength.value = data.wordLength
        hints.value = (data.hintedPositions as number[]).map((pos: number, i: number) => ({
          position: pos,
          letter: data.hintedLetters[i] as string,
        }))
        phase.value = 'playing'
      } else {
        alreadyPlayedData.value = { won: !!data.winnerId, attempts: data.attempts }
        const today = new Date().toISOString().slice(0, 10)
        dailyShareText.value = localStorage.getItem(`wordev-daily-share-${today}`)
        phase.value = 'already_played'
      }
    } catch {
      error.value = 'Could not check daily status.'
      phase.value = 'setup'
    }
  }

  function saveShareText(won: boolean) {
    const date = new Date().toISOString().slice(0, 10)
    const emojiMap: Record<LetterResult, string> = { correct: '🟩', present: '🟨', absent: '⬛' }
    const grid = guesses.value.map(g => g.result.map(r => emojiMap[r]).join('')).join('\n')
    const text = `Wordev Daily ${date}\n${won ? guesses.value.length : 'X'}/6\n\n${grid}`
    localStorage.setItem(`wordev-daily-share-${date}`, text)
    dailyShareText.value = text
  }

  async function shareResult(): Promise<'shared' | 'copied' | 'failed'> {
    if (!dailyShareText.value) return 'failed'
    try {
      if (navigator.share) {
        await navigator.share({ text: dailyShareText.value })
        return 'shared'
      }
      await navigator.clipboard.writeText(dailyShareText.value)
      return 'copied'
    } catch {
      return 'failed'
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
          if (mode.value === 'daily') saveShareText(true)
          phase.value = 'won'
        } else {
          const statusRes = await api.get(`/games/solo/${gameId.value}`)
          revealedWord.value = statusRes.data.word
          if (mode.value === 'daily') saveShareText(false)
          phase.value = 'lost'
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  async function requestHint() {
    if (!gameId.value || phase.value !== 'playing' || hintsLeft.value <= 0 || isHinting.value) return
    isHinting.value = true
    try {
      const res = await api.post('/games/solo/hint', { gameId: gameId.value })
      hints.value.push({ position: res.data.position, letter: res.data.letter })
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Could not get hint'
    } finally {
      isHinting.value = false
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
    phase, mode, selectedLength, wordLength, gameId,
    guesses, revealingGuess, revealedTiles,
    currentInput, error, isSubmitting, revealedWord,
    hints, letterColors, attemptsLeft, hintsLeft, isHinting,
    alreadyPlayedData, dailyShareText,
    startGame, submitGuess, addLetter, removeLetter, reset, requestHint,
    checkDailyStatus, shareResult,
  }
})
