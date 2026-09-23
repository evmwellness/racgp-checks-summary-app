import type { MCQ, Specialty } from './types'

export type QuizQuestion = MCQ & { source?: string; specialty?: Specialty }

export interface AnsweredQuestion {
  q: QuizQuestion
  picked: number | null
  correct: boolean
}
