import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchAdminDashboard } from '../../services/dashboard'

type DashboardStats = {
  pending_requests: number
  pending_requests_trend: string
  mcqs_crafted: number
  mcqs_crafted_trend: string
  recommendations_sent: number
  recommendations_sent_trend: string
}

type RecentRequest = {
  id: number
  title: string
  student: string
  student_email: string
  due: string
  status: string
  request_status: string
  created_at: string
  interests: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAdminDashboard()
        setStats(data.stats)
        setRecentRequests(data.recent_requests || [])
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error?.response?.data?.detail || 'Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-300">Pending requests</p>
          <p className="mt-3 font-display text-4xl text-white">
            {stats ? formatNumber(stats.pending_requests) : '0'}
          </p>
          <p className="mt-2 text-sm text-brand-light">
            {stats?.pending_requests_trend || 'No change'}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-300">MCQs crafted</p>
          <p className="mt-3 font-display text-4xl text-white">
            {stats ? formatNumber(stats.mcqs_crafted) : '0'}
          </p>
          <p className="mt-2 text-sm text-brand-light">
            {stats?.mcqs_crafted_trend || 'No change'}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-300">Recommendations sent</p>
          <p className="mt-3 font-display text-4xl text-white">
            {stats ? formatNumber(stats.recommendations_sent) : '0'}
          </p>
          <p className="mt-2 text-sm text-brand-light">
            {stats?.recommendations_sent_trend || 'No change'}
          </p>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Workload</p>
            <h3 className="font-display text-2xl text-white">Focus queue</h3>
          </div>
          <Link
            to="/admin/requests"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand"
          >
            View requests
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-black/30 p-8 text-center">
            <p className="text-slate-400">No pending requests at the moment</p>
            <p className="mt-2 text-sm text-slate-500">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((item) => (
              <Link
                key={item.id}
                to={`/admin/requests`}
                className="block rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:border-brand/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.student}</p>
                    <p className="font-semibold text-xl text-white">{item.title}</p>
                    <p className="text-sm text-slate-300">
                      Focus: {item.interests.length > 50 ? `${item.interests.substring(0, 50)}...` : item.interests}
                    </p>
                    <p className="text-sm text-slate-400">Due: {item.due}</p>
                  </div>
                  <span className="rounded-full bg-brand/20 px-4 py-2 text-xs font-semibold text-white">
                    {item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
