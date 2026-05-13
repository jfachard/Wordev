export type LetterResult = 'correct' | 'present' | 'absent'

export type GamePhase = 'setup' | 'loading' | 'playing' | 'won' | 'lost' | 'already_played'

export interface Guess {
  letters: string[]
  result: LetterResult[]
}
