import { ref, computed, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { socketService } from '@/services/socket'
import type { Guess, LetterResult } from '@/types/game'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function decodeUserId(token: string): string | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(base64)) as { userId?: string }).userId ?? null
  } catch {
    return null
  }
}

type VersusPhase = 'queue' | 'playing' | 'game_over'

interface GameOverData {
  winnerId: string
  word: string
  players: Record<string, { eloBefore: number; eloAfter: number; eloDelta: number }>
  disconnected?: boolean
}

export const useVersusStore = defineStore('versus', () => {
  const phase = ref<VersusPhase>('queue')
  const connectionStatus = ref<'connecting' | 'connected' | 'queued' | 'error'>('connecting')
  const myUserId = ref<string | null>(null)
  const gameId = ref<string | null>(null)
  const wordLength = ref(5)
  const opponentUsername = ref('')
  const opponentElo = ref(0)
  const opponentAttempts = ref(0)
  const guesses = ref<Guess[]>([])
  const revealingGuess = ref<Guess | null>(null)
  const revealedTiles = ref<Set<number>>(new Set())
  const currentInput = ref('')
  const error = ref('')
  const isSubmitting = ref(false)
  const isRevealing = ref(false)
  const gameOverData = ref<GameOverData | null>(null)

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

  const iWon = computed(() => {
    if (!gameOverData.value || !myUserId.value) return false
    return gameOverData.value.winnerId === myUserId.value
  })

  const myElo = computed(() => {
    if (!gameOverData.value || !myUserId.value) return null
    return gameOverData.value.players[myUserId.value] ?? null
  })

  function connect(onGameStart: () => void) {
    const token = localStorage.getItem('accessToken') ?? ''
    myUserId.value = decodeUserId(token)
    const socket = socketService.connect(token)

    socket.on('connect', () => {
      connectionStatus.value = 'connected'
    })

    socket.on('authenticated', () => {
      socket.emit('join_queue')
    })

    socket.on('connect_error', (err) => {
      connectionStatus.value = 'error'
      error.value = `Connection failed: ${err.message}`
    })

    socket.on('disconnect', (reason) => {
      if (phase.value === 'queue') {
        connectionStatus.value = 'error'
        error.value = `Disconnected: ${reason}`
      }
    })

    socket.on('queue_joined', () => {
      connectionStatus.value = 'queued'
    })

    socket.on('queue_error', (data: { message: string }) => {
      error.value = data.message
    })

    socket.on(
      'game_start',
      (data: { gameId: string; wordLength: number; opponentUsername: string; opponentElo: number }) => {
        gameId.value = data.gameId
        wordLength.value = data.wordLength
        opponentUsername.value = data.opponentUsername
        opponentElo.value = data.opponentElo
        phase.value = 'playing'
        onGameStart()
      },
    )

    socket.on(
      'guess_result',
      async (data: { result: { letter: string; status: LetterResult }[]; isWin: boolean }) => {
        const letters = data.result.map((r) => r.letter)
        const result = data.result.map((r) => r.status)

        isRevealing.value = true
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
        isSubmitting.value = false
        isRevealing.value = false
      },
    )

    socket.on('guess_error', (data: { message: string }) => {
      error.value = data.message
      isSubmitting.value = false
    })

    socket.on('opponent_progress', (data: { attempts: number }) => {
      opponentAttempts.value = data.attempts
    })

    socket.on('game_over', async (data: GameOverData) => {
      // Wait for any ongoing reveal animation before showing modal
      while (isRevealing.value) {
        await sleep(50)
      }
      gameOverData.value = data
      phase.value = 'game_over'
    })

  }

  function leaveQueue() {
    socketService.get()?.emit('leave_queue')
    socketService.disconnect()
    reset()
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

  function submitGuess() {
    if (isSubmitting.value || !gameId.value) return
    if (currentInput.value.length !== wordLength.value) {
      error.value = `Word must be ${wordLength.value} letters`
      return
    }
    error.value = ''
    isSubmitting.value = true
    socketService.get()?.emit('submit_guess', { gameId: gameId.value, guess: currentInput.value })
  }

  function reset() {
    phase.value = 'queue'
    connectionStatus.value = 'connecting'
    myUserId.value = null
    gameId.value = null
    wordLength.value = 5
    opponentUsername.value = ''
    opponentElo.value = 0
    opponentAttempts.value = 0
    guesses.value = []
    revealingGuess.value = null
    revealedTiles.value = new Set()
    currentInput.value = ''
    error.value = ''
    isSubmitting.value = false
    isRevealing.value = false
    gameOverData.value = null
  }

  return {
    phase,
    connectionStatus,
    gameId,
    wordLength,
    opponentUsername,
    opponentElo,
    opponentAttempts,
    guesses,
    revealingGuess,
    revealedTiles,
    currentInput,
    error,
    isSubmitting,
    gameOverData,
    letterColors,
    iWon,
    myElo,
    connect,
    leaveQueue,
    addLetter,
    removeLetter,
    submitGuess,
    reset,
  }
})
