import { useCallback, useEffect, useState } from 'react'
import type { Specialty } from './types'
import type { AnsweredQuestion } from './quizTypes'

export interface UnitProgress {
  read?: boolean
  mcqBest?: number
  mcqTotal?: number
  kfpDone?: boolean
}

type SpecialtyTally = { correct: number; total: number }

export interface QuizAttempt {
  date: string // ISO
  unitId: string // unit id, or 'mixed' for the cross-unit mixed quiz
  label: string // display label, e.g. unit title or "Mixed AKT quiz"
  score: number
  total: number
  bySpecialty: Partial<Record<Specialty, SpecialtyTally>>
}

type Progress = Record<string, UnitProgress>

const PROGRESS_KEY = 'check-prep-progress-v1'
const ATTEMPTS_KEY = 'check-prep-attempts-v1'
const MAX_ATTEMPTS = 200

function load(): Progress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as Progress
  } catch {
    return {}
  }
}

function loadAttempts(): QuizAttempt[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as QuizAttempt[]) : []
  } catch {
    return []
  }
}

/** Tallies correct/total per specialty from one quiz's answered questions. */
export function summarizeBySpecialty(records: AnsweredQuestion[]): QuizAttempt['bySpecialty'] {
  const map: QuizAttempt['bySpecialty'] = {}
  for (const r of records) {
    const specialty = r.q.specialty
    if (!specialty) continue
    const prev = map[specialty] ?? { correct: 0, total: 0 }
    prev.total += 1
    if (r.correct) prev.correct += 1
    map[specialty] = prev
  }
  return map
}

/** Aggregates per-specialty accuracy across all recorded quiz attempts. */
export function aggregateSpecialtyStats(attempts: QuizAttempt[]): { specialty: Specialty; correct: number; total: number }[] {
  const map = new Map<Specialty, SpecialtyTally>()
  for (const a of attempts) {
    for (const [specialty, tally] of Object.entries(a.bySpecialty) as [Specialty, SpecialtyTally][]) {
      const prev = map.get(specialty) ?? { correct: 0, total: 0 }
      prev.correct += tally.correct
      prev.total += tally.total
      map.set(specialty, prev)
    }
  }
  return [...map.entries()]
    .map(([specialty, tally]) => ({ specialty, ...tally }))
    .sort((a, b) => b.total - a.total || a.specialty.localeCompare(b.specialty))
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)
  const [attempts, setAttempts] = useState<QuizAttempt[]>(loadAttempts)

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // storage unavailable (private mode) - progress just won't persist
    }
  }, [progress])

  useEffect(() => {
    try {
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
    } catch {
      // storage unavailable (private mode) - history just won't persist
    }
  }, [attempts])

  const update = useCallback((id: string, patch: UnitProgress) => {
    setProgress((p) => ({ ...p, [id]: { ...p[id], ...patch } }))
  }, [])

  const recordMcq = useCallback((unitId: string, label: string, records: AnsweredQuestion[]) => {
    const total = records.length
    const score = records.filter((r) => r.correct).length

    setProgress((p) => {
      const prev = p[unitId] ?? {}
      const best = Math.max(prev.mcqBest ?? 0, score)
      return { ...p, [unitId]: { ...prev, mcqBest: best, mcqTotal: total } }
    })

    setAttempts((prev) => {
      const attempt: QuizAttempt = {
        date: new Date().toISOString(),
        unitId,
        label,
        score,
        total,
        bySpecialty: summarizeBySpecialty(records),
      }
      return [attempt, ...prev].slice(0, MAX_ATTEMPTS)
    })
  }, [])

  const reset = useCallback(() => {
    setProgress({})
    setAttempts([])
  }, [])

  return { progress, attempts, update, recordMcq, reset }
}
