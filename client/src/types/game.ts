export type LetterResult = 'correct' | 'present' | 'absent'

export type GamePhase = 'setup' | 'playing' | 'won' | 'lost'

export interface Guess {
  letters: string[]
  result: LetterResult[]
}
