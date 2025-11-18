import { useEffect, useState } from 'react'

import { fetchStudentRecommendations } from '../../services/dashboard'

type RoadmapStep = {
  id: number
  order: number
  title: string
  description: string
}

type Recommendation = {
  id: number
  career_name: string
  summary: string
  created_at: string
  test_id: number
  request_id: number
  steps: RoadmapStep[]
}

export default function StudentRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        const data = await fetchStudentRecommendations()
        setRecommendations(data.recommendations || [])
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error?.response?.data?.detail || 'Unable to load recommendations.')
      } finally {
        setLoading(false)
      }
    }
    loadRecommendations()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
          <p className="text-sm uppercase tracking-[0.3em] text-brand">Your path</p>
          <h3 className="font-display text-2xl text-ink">Career recommendations</h3>
        </div>
        <p className="text-sm text-muted">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white/70 bg-white/90 p-10 text-center shadow-glass">
          <p className="text-sm uppercase tracking-[0.3em] text-brand">No recommendations yet</p>
          <h3 className="mt-4 font-display text-2xl text-ink">Waiting for review</h3>
          <p className="mt-3 text-slate-600">
            Complete your tests and wait for an admin to review your answers and create a personalized recommendation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-glass"
            >
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Recommended career</p>
                    <h4 className="mt-1 font-display text-3xl text-ink">{recommendation.career_name}</h4>
                  </div>
                  <span className="rounded-full bg-brand/10 px-4 py-2 text-xs font-semibold text-brand">
                    {formatDate(recommendation.created_at)}
                  </span>
                </div>
                <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/5 p-4">
                  <p className="text-sm font-semibold text-brand">Why this career?</p>
                  <p className="mt-2 text-slate-700">{recommendation.summary}</p>
                </div>
              </div>

              {recommendation.steps.length > 0 && (
                <div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-muted">
                    Your roadmap
                  </p>
                  <div className="space-y-4">
                    {recommendation.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand bg-brand/10 text-sm font-bold text-brand">
                            {step.order}
                          </div>
                          {index < recommendation.steps.length - 1 && (
                            <div className="mt-2 h-full w-0.5 bg-slate-200" style={{ minHeight: '40px' }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-ink">{step.title}</h5>
                          {step.description && (
                            <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

