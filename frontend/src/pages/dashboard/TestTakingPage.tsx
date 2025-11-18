import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { fetchStudentTestDetail, submitAnswer, submitTest } from '../../services/dashboard'

type Option = {
  id: number
  label: string
  description: string
  order: number
}

type Question = {
  id: number
  prompt: string
  order: number
  options: Option[]
  selected_option_id: number | null
}

type Test = {
  id: number
  request_id: number
  questions: Question[]
  total_questions: number
  answered_count: number
}

export default function TestTakingPage() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const [test, setTest] = useState<Test | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setError('Test ID is required.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await fetchStudentTestDetail(parseInt(testId))
        setTest(data.test)
        const initialAnswers: Record<number, number> = {}
        data.test.questions.forEach((q: Question) => {
          if (q.selected_option_id) {
            initialAnswers[q.id] = q.selected_option_id
          }
        })
        setAnswers(initialAnswers)
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string; detail?: string } } }
        setError(error?.response?.data?.error || error?.response?.data?.detail || 'Unable to load test.')
      } finally {
        setLoading(false)
      }
    }
    loadTest()
  }, [testId])

  const handleSelectOption = async (questionId: number, optionId: number) => {
    if (!testId || !test) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    try {
      await submitAnswer(parseInt(testId), questionId, optionId)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } }
      setError(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to save answer.')
    }
  }

  const handleSubmitTest = async () => {
    if (!testId || !test) return
    if (Object.keys(answers).length < test.total_questions) {
      setError(`Please answer all questions. ${Object.keys(answers).length}/${test.total_questions} answered.`)
      return
    }
    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return
    }
    try {
      setSubmitting(true)
      await submitTest(parseInt(testId))
      navigate('/dashboard/tests', { replace: true })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } }
      setError(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to submit test.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  if (error && !test) {
    return (
      <div className="rounded-[2.5rem] border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate('/dashboard/tests')}
          className="mt-4 rounded-full border border-red-300 bg-red-100 px-6 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
        >
          Back to tests
        </button>
      </div>
    )
  }

  if (!test) {
    return null
  }

  const currentQuestion = test.questions[currentQuestionIndex]
  const progress = Math.round(((currentQuestionIndex + 1) / test.total_questions) * 100)
  const allAnswered = Object.keys(answers).length === test.total_questions

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand">Test taking</p>
          <h3 className="font-display text-2xl text-ink">Question {currentQuestionIndex + 1} of {test.total_questions}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">{Object.keys(answers).length} / {test.total_questions} answered</p>
            <p className="text-xs text-muted">Progress: {progress}%</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-glass">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">Question {currentQuestionIndex + 1}</span>
            <span className="text-slate-600">{progress}% complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="mb-4 text-lg font-semibold text-ink">{currentQuestion.prompt}</h4>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 shadow-md'
                      : 'border-slate-200 bg-white hover:border-brand/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${
                        isSelected ? 'border-brand bg-brand' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-brand' : 'text-ink'}`}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === test.questions.length - 1}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          {allAnswered && (
            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="rounded-full border border-brand bg-brand px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit test'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-glass">
        <p className="mb-3 text-sm font-semibold text-ink">Question navigation</p>
        <div className="flex flex-wrap gap-2">
          {test.questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined
            const isCurrent = index === currentQuestionIndex
            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                  isCurrent
                    ? 'border-brand bg-brand text-white'
                    : isAnswered
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand'
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

