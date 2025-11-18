import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { BrandLogo } from '../../components/BrandLogo'
import { storeTokens } from '../../lib/api'
import { login } from '../../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await login({ email, password })
      storeTokens(data.access, data.refresh)
      navigate('/auth/me', { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? 'Unable to sign in. Check credentials.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-12 lg:grid-cols-2">
        <div className="hidden flex-col justify-between rounded-[2.5rem] border border-white/70 bg-white/80 p-10 shadow-glass backdrop-blur lg:flex">
          <BrandLogo />
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
              Welcome back, coach
            </p>
            <h1 className="font-display text-4xl text-ink">Design meaningful journeys—one student at a time.</h1>
            <p className="text-lg text-slate-600">
              Review student stories, craft MCQs, decode selections, and deliver actionable career roadmaps.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-6">
              <p className="text-sm text-muted">Average roadmap delivery</p>
              <p className="font-display text-3xl text-ink">&lt; 48h</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-6">
              <p className="text-sm text-muted">Mentors active today</p>
              <p className="font-display text-3xl text-ink">120+</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-lg shadow-brand/10">
            <div className="mb-8 space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Portal access</p>
              <h2 className="font-display text-3xl text-ink">Sign in</h2>
              <p className="text-sm text-muted">Use your registered email to continue.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-brand py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              New here?{' '}
              <Link className="font-semibold text-brand" to="/auth/register">
                Create an account
              </Link>
            </p>
            <div className="mt-10 rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-xs text-muted">
              Use the admin account credentials after you create one via the Django backend.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
