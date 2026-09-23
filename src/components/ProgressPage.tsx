import { useMemo } from 'react'
import type { QuizAttempt } from '../useProgress'
import { aggregateSpecialtyStats } from '../useProgress'
import { go } from '../useHashRoute'

interface Props {
  attempts: QuizAttempt[]
}

type Tier = 'strength' | 'developing' | 'needs-practice'

const MIN_SAMPLE = 3

function tierFor(pct: number): Tier {
  if (pct >= 80) return 'strength'
  if (pct >= 50) return 'developing'
  return 'needs-practice'
}

const TIER_STYLE: Record<Tier, { bar: string; badge: string; label: string }> = {
  strength: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800', label: 'Strength' },
  developing: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'Developing' },
  'needs-practice': { bar: 'bg-red-500', badge: 'bg-red-100 text-red-800', label: 'Needs practice' },
}

export default function ProgressPage({ attempts }: Props) {
  const specialtyStats = useMemo(() => aggregateSpecialtyStats(attempts), [attempts])

  const overall = useMemo(() => {
    const total = attempts.reduce((sum, a) => sum + a.total, 0)
    const correct = attempts.reduce((sum, a) => sum + a.score, 0)
    return { total, correct, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }, [attempts])

  const withEnoughSample = specialtyStats.filter((s) => s.total >= MIN_SAMPLE)
  const strengths = [...withEnoughSample]
    .map((s) => ({ ...s, pct: Math.round((s.correct / s.total) * 100) }))
    .filter((s) => tierFor(s.pct) === 'strength')
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
  const weaknesses = [...withEnoughSample]
    .map((s) => ({ ...s, pct: Math.round((s.correct / s.total) * 100) }))
    .filter((s) => tierFor(s.pct) !== 'strength')
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)

  if (attempts.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          No quiz attempts yet — complete an AKT quiz on a unit, or try the mixed quiz, and your strengths and weak areas will show up here.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
      <p className="mt-1 text-slate-600">How you're tracking across every AKT quiz you've done.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Questions answered</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{overall.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall accuracy</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{overall.pct}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quizzes completed</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{attempts.length}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-900">💪 Strengths</p>
          {strengths.length === 0 ? (
            <p className="mt-1 text-sm text-green-800/70">Keep practicing — nothing at 80%+ yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm font-medium text-green-900">
              {strengths.map((s) => (
                <li key={s.specialty}>
                  {s.specialty} — {s.pct}% ({s.correct}/{s.total})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-900">🎯 Areas to improve</p>
          {weaknesses.length === 0 ? (
            <p className="mt-1 text-sm text-red-800/70">Nothing standing out — nice work.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm font-medium text-red-900">
              {weaknesses.map((s) => (
                <li key={s.specialty}>
                  {s.specialty} — {s.pct}% ({s.correct}/{s.total})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-800">By specialty</p>
        <ul className="mt-3 space-y-3">
          {specialtyStats.map((s) => {
            const pct = Math.round((s.correct / s.total) * 100)
            const tier = tierFor(pct)
            const style = TIER_STYLE[tier]
            return (
              <li key={s.specialty}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-700">{s.specialty}</span>
                  <span className="flex items-center gap-2 text-slate-500">
                    {s.correct}/{s.total} ({pct}%)
                    {s.total >= MIN_SAMPLE ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Few questions</span>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-800">Recent quizzes</p>
        <ul className="mt-3 divide-y divide-slate-100">
          {attempts.slice(0, 20).map((a, i) => {
            const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0
            const date = new Date(a.date)
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <button
                    onClick={() => a.unitId !== 'mixed' && go(`/unit/${a.unitId}`)}
                    className={`font-medium text-slate-700 ${a.unitId !== 'mixed' ? 'hover:text-teal-700 hover:underline' : ''}`}
                  >
                    {a.label}
                  </button>
                  <p className="text-xs text-slate-400">
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="font-semibold text-slate-700">
                  {a.score}/{a.total} · {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
