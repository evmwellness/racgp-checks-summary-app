import { useMemo, useState } from 'react'
import { shuffle } from '../shuffle'
import type { AnsweredQuestion, QuizQuestion } from '../quizTypes'

interface Props {
  questions: QuizQuestion[]
  onFinish?: (records: AnsweredQuestion[]) => void
}

interface Prepared {
  q: QuizQuestion
  order: number[]
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function McqQuiz({ questions, onFinish }: Props) {
  const [round, setRound] = useState(0)
  const prepared: Prepared[] = useMemo(
    () => questions.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) })),
    [questions, round],
  )
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([])
  const [done, setDone] = useState(false)

  if (questions.length === 0) return <p className="text-slate-500">No questions available.</p>

  if (done) {
    const score = answers.filter((a) => a.correct).length
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-500">Your score</p>
          <p className="mt-1 text-4xl font-bold text-teal-700">
            {score} / {questions.length}
          </p>
          <p className="mt-2 text-slate-600">
            {pct >= 80 ? 'Excellent – exam ready on this topic.' : pct >= 60 ? 'Good – review the explanations you missed.' : 'Re-read the summary, then try again.'}
          </p>
          <button
            className="mt-5 rounded-lg bg-teal-700 px-5 py-2 font-medium text-white hover:bg-teal-800"
            onClick={() => {
              setIdx(0)
              setPicked(null)
              setAnswers([])
              setDone(false)
              setRound((r) => r + 1)
            }}
          >
            Try again
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="mb-3 text-sm font-semibold text-slate-700">Review your answers</p>
          <ul className="space-y-3">
            {answers.map((a, i) => (
              <li key={i} className={`rounded-lg border p-3 sm:p-4 ${a.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {a.q.source && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{a.q.source}</p>}
                <p className="text-[15px] font-medium leading-relaxed text-slate-800">
                  {i + 1}. {a.q.stem}
                </p>
                <p className={`mt-1.5 text-sm font-semibold ${a.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {a.correct
                    ? `✓ Correct — ${a.q.options[a.q.answer]}`
                    : `✗ You chose: ${a.picked !== null ? a.q.options[a.picked] : '(skipped)'} · Correct answer: ${a.q.options[a.q.answer]}`}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.q.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const { q, order } = prepared[idx]
  const answered = picked !== null

  function choose(orig: number) {
    if (answered) return
    setPicked(orig)
  }

  function next() {
    const record: AnsweredQuestion = { q, picked, correct: picked === q.answer }
    const nextAnswers = [...answers, record]
    if (idx + 1 >= questions.length) {
      setAnswers(nextAnswers)
      setDone(true)
      onFinish?.(nextAnswers)
    } else {
      setAnswers(nextAnswers)
      setIdx(idx + 1)
      setPicked(null)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span>Score {answers.filter((a) => a.correct).length}</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded bg-slate-100">
        <div className="h-full bg-teal-600 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      {q.source && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-teal-700">{q.source}</p>}
      <p className="text-[17px] leading-relaxed">{q.stem}</p>
      <div className="mt-4 space-y-2">
        {order.map((orig, pos) => {
          const isCorrect = orig === q.answer
          const isPicked = orig === picked
          let cls = 'border-slate-200 hover:border-teal-500 hover:bg-teal-50'
          if (answered) {
            if (isCorrect) cls = 'border-green-500 bg-green-50'
            else if (isPicked) cls = 'border-red-400 bg-red-50'
            else cls = 'border-slate-200 opacity-70'
          }
          return (
            <button
              key={orig}
              onClick={() => choose(orig)}
              disabled={answered}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${cls}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {LETTERS[pos]}
              </span>
              <span>{q.options[orig]}</span>
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-4 rounded-lg p-4 ${picked === q.answer ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold">{picked === q.answer ? 'Correct' : `Answer: ${q.options[q.answer]}`}</p>
          <p className="mt-1 leading-relaxed">{q.explanation}</p>
        </div>
      )}
      {answered && (
        <div className="mt-4 text-right">
          <button onClick={next} className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white hover:bg-teal-800">
            {idx + 1 >= questions.length ? 'See score' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  )
}
