import type { Guess, LetterResult } from '@/types/game'
import api from '@/services/api'

const EMOJI: Record<LetterResult, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
}

const MAX_ATTEMPTS = 6

export function buildEmojiGrid(guesses: Guess[]): string {
  return guesses.map((g) => g.result.map((r) => EMOJI[r]).join('')).join('\n')
}

export type ShareMode = 'daily' | 'solo' | 'versus'

export interface ShareOptions {
  mode: ShareMode
  won: boolean
  guesses: Guess[]
  date?: string
  wordLength?: number
}

export function buildShareText(opts: ShareOptions): string {
  const { mode, won, guesses } = opts
  const score = won ? `${guesses.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`
  const grid = buildEmojiGrid(guesses)

  let header: string
  if (mode === 'daily') {
    const date = opts.date ?? new Date().toISOString().slice(0, 10)
    header = `Wordev Daily ${date}\n${score}`
  } else if (mode === 'solo') {
    const len = opts.wordLength ?? guesses[0]?.letters.length ?? 5
    header = `Wordev Solo (${len}L)\n${score}`
  } else {
    header = `Wordev Versus\n${won ? `Won in ${score}` : 'Lost'}`
  }

  return `${header}\n\n${grid}`
}

// Returns 'shared' when the OS share sheet handled it (or was dismissed),
// 'copied' on clipboard fallback, 'failed' only on a real error.
export async function shareOrCopy(
  text: string,
): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'shared'
    return 'failed'
  }
}

export async function postShareToDiscord(
  gameId: string,
  shareText: string,
): Promise<void> {
  await api.post(`/games/${gameId}/share/discord`, { shareText })
}
