import { useEffect, useState } from 'react'

import { exportRecommendationPDF, fetchStudentRecommendations, updateResourceProgress } from '../../services/dashboard'

type RoadmapStep = {
  id: number
  order: number
  title: string
  description: string
}

type Resource = {
  id: number
  title: string
  description: string
  resource_type: string
  url?: string
  file_url?: string
  difficulty_level: string
  is_free: boolean
  cost?: number
  category?: {
    id: number
    name: string
    icon?: string
  }
  student_progress?: {
    status: string
    is_favorite: boolean
    notes?: string
  } | null
}

type Recommendation = {
  id: number
  career_name: string
  summary: string
  created_at: string
  test_id: number
  request_id: number
  steps: RoadmapStep[]
  resources?: Resource[]
}

export default function StudentRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<number | null>(null)

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

  const handleExportPDF = async (recommendationId: number) => {
    setExporting(recommendationId)
    try {
      await exportRecommendationPDF(recommendationId)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to export PDF.')
    } finally {
      setExporting(null)
    }
  }

  const handleResourceStatusUpdate = async (resourceId: number, status: string) => {
    try {
      await updateResourceProgress(resourceId, { status })
      // Refresh recommendations to get updated progress
      const data = await fetchStudentRecommendations()
      setRecommendations(data.recommendations || [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to update resource status.')
    }
  }

  const getResourceTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      article: '📄',
      video: '🎥',
      course: '📚',
      book: '📖',
      certification: '🏆',
      tool: '🛠️',
      community: '👥',
      report: '📊',
      other: '📌',
    }
    return icons[type] || icons.other
  }

  const getDifficultyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    }
    return colors[level] || colors.beginner
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
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand/10 px-4 py-2 text-xs font-semibold text-brand">
                      {formatDate(recommendation.created_at)}
                    </span>
                    <button
                      onClick={() => handleExportPDF(recommendation.id)}
                      disabled={exporting === recommendation.id}
                      className="flex items-center gap-2 rounded-full border border-brand bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {exporting === recommendation.id ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export PDF
                        </>
                      )}
                    </button>
                  </div>
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

              {recommendation.resources && recommendation.resources.length > 0 && (
                <div className="mt-8">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-muted">
                    Learning Resources
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendation.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getResourceTypeIcon(resource.resource_type)}</span>
                              <h5 className="font-semibold text-ink">{resource.title}</h5>
                            </div>
                            {resource.category && (
                              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                {resource.category.icon} {resource.category.name}
                              </span>
                            )}
                            <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(resource.difficulty_level)}`}>
                                {resource.difficulty_level}
                              </span>
                              {resource.is_free ? (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                  Free
                                </span>
                              ) : (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                  ${resource.cost}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                              Open Resource
                            </a>
                          )}
                          {resource.file_url && (
                            <a
                              href={resource.file_url}
                              download
                              className="flex-1 rounded-lg border border-brand bg-white px-4 py-2 text-center text-sm font-semibold text-brand transition hover:bg-brand/5"
                            >
                              Download
                            </a>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <select
                            value={resource.student_progress?.status || 'not_started'}
                            onChange={(e) => handleResourceStatusUpdate(resource.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs focus:border-brand focus:outline-none"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="skipped">Skipped</option>
                          </select>
                          {resource.student_progress?.is_favorite && (
                            <span className="text-yellow-500">⭐</span>
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

