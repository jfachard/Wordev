import { ref, computed, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { buildShareText, shareOrCopy } from '@/utils/share'
import type { Guess, LetterResult, GamePhase } from '@/types/game'

const MAX_ATTEMPTS = 6
const MAX_HINTS = 3
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function guestDailyKey() {
  return `wordev-guest-daily-${new Date().toISOString().slice(0, 10)}`
}

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('setup')
  const mode = ref<'solo' | 'daily'>('solo')
  const selectedLength = ref<number | null>(null)
  const wordLength = ref(5)
  const gameId = ref<string | null>(null)
  const guestSessionId = ref<string | null>(null)
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

  const isGuest = computed(() => !useAuthStore().isAuthenticated)
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

  function resetToSetup() {
    reset()
    phase.value = 'setup'
  }

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
    gameId.value = null
    guestSessionId.value = null
  }

  function saveGuestDailyState() {
    localStorage.setItem(guestDailyKey(), JSON.stringify({
      sessionId: guestSessionId.value,
      wordLength: wordLength.value,
      guesses: guesses.value,
      hints: hints.value,
      phase: phase.value,
      revealedWord: revealedWord.value,
    }))
  }

  async function startGame() {
    error.value = ''
    try {
      if (isGuest.value) {
        if (mode.value === 'daily') {
          const res = await api.post('/games/guest/daily/start')
          const { sessionId, wordLength: wl } = res.data
          reset()
          guestSessionId.value = sessionId
          wordLength.value = wl
          saveGuestDailyState()
        } else {
          const qs = selectedLength.value ? `?length=${selectedLength.value}` : ''
          const res = await api.post(`/games/guest/solo/start${qs}`)
          const { sessionId, wordLength: wl } = res.data
          reset()
          guestSessionId.value = sessionId
          wordLength.value = wl
        }
      } else {
        if (mode.value === 'daily') {
          const res = await api.post('/games/daily/start')
          const { gameId: gid, wordLength: wl } = res.data
          reset()
          gameId.value = gid
          wordLength.value = wl
        } else {
          const body: { length?: number } = {}
          if (selectedLength.value !== null) body.length = selectedLength.value
          const res = await api.post('/games/solo/start', body)
          const gid = res.data.id
          const wl = res.data.wordLength
          reset()
          gameId.value = gid
          wordLength.value = wl
        }
      }
      phase.value = 'playing'
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Failed to start game. Try again.'
    }
  }

  function cleanupOldShareTexts() {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (!key) continue
      let date: string | null = null
      if (key.startsWith('wordev-daily-share-')) date = key.slice('wordev-daily-share-'.length)
      else if (key.startsWith('wordev-guest-daily-')) date = key.slice('wordev-guest-daily-'.length)
      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/) && date < cutoffStr) {
        localStorage.removeItem(key)
      }
    }
  }

  async function checkDailyStatus() {
    cleanupOldShareTexts()
    phase.value = 'loading'

    if (isGuest.value) {
      const saved = localStorage.getItem(guestDailyKey())
      if (saved) {
        try {
          const data = JSON.parse(saved)
          guestSessionId.value = data.sessionId
          wordLength.value = data.wordLength
          guesses.value = data.guesses ?? []
          hints.value = data.hints ?? []
          revealedWord.value = data.revealedWord ?? null
          const today = new Date().toISOString().slice(0, 10)
          dailyShareText.value = localStorage.getItem(`wordev-daily-share-${today}`)
          const savedPhase: GamePhase = data.phase
          if (savedPhase === 'won' || savedPhase === 'lost') {
            alreadyPlayedData.value = { won: savedPhase === 'won', attempts: guesses.value.length }
            phase.value = 'already_played'
          } else {
            phase.value = savedPhase === 'playing' ? 'playing' : 'setup'
          }
          return
        } catch {
          localStorage.removeItem(guestDailyKey())
        }
      }
      phase.value = 'setup'
      return
    }

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
        gameId.value = data.gameId
        alreadyPlayedData.value = { won: data.won, attempts: data.attempts }
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
    const text = buildShareText({ mode: 'daily', won, guesses: guesses.value, date })
    localStorage.setItem(`wordev-daily-share-${date}`, text)
    dailyShareText.value = text
  }

  async function shareResult(): Promise<'shared' | 'copied' | 'failed'> {
    const text = getShareText()
    if (!text) return 'failed'
    return shareOrCopy(text)
  }

  function getShareText(): string | null {
    if (mode.value === 'daily') return dailyShareText.value
    return buildShareText({
      mode: 'solo',
      won: phase.value === 'won',
      guesses: guesses.value,
      wordLength: wordLength.value,
    })
  }

  async function submitGuess() {
    if (isSubmitting.value || phase.value !== 'playing') return
    const sessionOrGameId = isGuest.value ? guestSessionId.value : gameId.value
    if (!sessionOrGameId) return
    if (currentInput.value.length !== wordLength.value) {
      error.value = `Word must be ${wordLength.value} letters`
      return
    }
    error.value = ''
    isSubmitting.value = true
    try {
      let resData: any
      if (isGuest.value) {
        const res = await api.post('/games/guest/guess', {
          sessionId: guestSessionId.value,
          guess: currentInput.value,
        })
        resData = res.data
      } else {
        const res = await api.post('/games/solo/guess', {
          gameId: gameId.value,
          guess: currentInput.value,
        })
        resData = res.data
      }

      const letters: string[] = resData.guess.split('')
      const result: LetterResult[] = resData.result
      const isWon = result.every(r => r === 'correct')
      const attemptsAfter = guesses.value.length + 1
      const isFinished = isWon || attemptsAfter >= MAX_ATTEMPTS

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
          if (isGuest.value && mode.value === 'daily') saveGuestDailyState()
        } else {
          if (isGuest.value) {
            const revRes = await api.get(`/games/guest/reveal/${guestSessionId.value}`)
            revealedWord.value = revRes.data.word
          } else {
            const statusRes = await api.get(`/games/solo/${gameId.value}`)
            revealedWord.value = statusRes.data.word
          }
          if (mode.value === 'daily') saveShareText(false)
          phase.value = 'lost'
          if (isGuest.value && mode.value === 'daily') saveGuestDailyState()
        }
      } else if (isGuest.value && mode.value === 'daily') {
        saveGuestDailyState()
      }
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  async function requestHint() {
    const sessionOrGameId = isGuest.value ? guestSessionId.value : gameId.value
    if (!sessionOrGameId || phase.value !== 'playing' || hintsLeft.value <= 0 || isHinting.value) return
    isHinting.value = true
    try {
      let resData: any
      if (isGuest.value) {
        const res = await api.post('/games/guest/hint', { sessionId: guestSessionId.value })
        resData = res.data
      } else {
        const res = await api.post('/games/solo/hint', { gameId: gameId.value })
        resData = res.data
      }
      hints.value.push({ position: resData.position, letter: resData.letter })
      if (isGuest.value && mode.value === 'daily') saveGuestDailyState()
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
    phase, mode, selectedLength, wordLength, gameId, guestSessionId,
    guesses, revealingGuess, revealedTiles,
    currentInput, error, isSubmitting, revealedWord,
    hints, letterColors, attemptsLeft, hintsLeft, isHinting,
    alreadyPlayedData, dailyShareText, isGuest,
    startGame, submitGuess, addLetter, removeLetter, reset, resetToSetup, requestHint,
    checkDailyStatus, shareResult, getShareText,
  }
})
