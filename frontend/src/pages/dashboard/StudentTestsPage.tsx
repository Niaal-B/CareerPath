import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchStudentTests } from '../../services/dashboard'

type Test = {
  id: number
  request_id: number
  created_at: string
  questions_count: number
  answered_count: number
}

export default function StudentTestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true)
        const data = await fetchStudentTests()
        setTests(data.tests || [])
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error?.response?.data?.detail || 'Unable to load tests.')
      } finally {
        setLoading(false)
      }
    }
    loadTests()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getProgress = (answered: number, total: number) => {
    if (total === 0) return 0
    return Math.round((answered / total) * 100)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[2.5rem] border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand">Assigned</p>
          <h3 className="font-display text-2xl text-ink">Your tests</h3>
        </div>
        <p className="text-sm text-muted">{tests.length} test{tests.length !== 1 ? 's' : ''} available</p>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white/70 bg-white/90 p-10 text-center shadow-glass">
          <p className="text-sm uppercase tracking-[0.3em] text-brand">No tests yet</p>
          <h3 className="mt-4 font-display text-2xl text-ink">Waiting for assignment</h3>
          <p className="mt-3 text-slate-600">
            Once an admin assigns a test to you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const progress = getProgress(test.answered_count, test.questions_count)
            const isComplete = test.answered_count === test.questions_count
            return (
              <Link
                key={test.id}
                to={`/dashboard/tests/${test.id}`}
                className="block rounded-3xl border border-white/70 bg-white/90 p-6 shadow-glass transition hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full bg-brand/20 px-4 py-2 text-xs font-semibold text-brand">
                        Test #{test.id}
                      </span>
                      <p className="text-xs text-muted">Assigned {formatDate(test.created_at)}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-semibold text-ink">
                            {test.answered_count} / {test.questions_count} questions
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-brand transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      {isComplete && (
                        <p className="text-sm font-semibold text-green-600">Ready to submit!</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl text-slate-300">→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

