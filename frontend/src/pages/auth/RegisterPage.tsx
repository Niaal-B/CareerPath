import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { BrandLogo } from '../../components/BrandLogo'
import { registerStudent } from '../../services/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    qualification: '',
    interests: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const phonePattern = /^\+?[1-9]\d{7,14}$/
    const namePattern = /^[A-Za-z][A-Za-z\s'-]{1,48}$/
    if (!namePattern.test(form.first_name) || !namePattern.test(form.last_name)) {
      setError('Names must be 2-50 chars, letters/spaces/hyphens/apostrophes only.')
      setLoading(false)
      return
    }
    if (!phonePattern.test(form.phone)) {
      setError('Enter a valid phone number (e.g., +911234567890).')
      setLoading(false)
      return
    }
    const requiredFields: Array<keyof typeof form> = [
      'first_name',
      'last_name',
      'email',
      'password',
      'phone',
      'qualification',
      'interests',
    ]
    const missing = requiredFields.find((field) => !form[field].trim())
    if (missing) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }
    try {
      await registerStudent(form)
      setSuccess('Registration successful! You can now sign in.')
      setTimeout(() => navigate('/auth/login'), 1200)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: unknown } }
      const detail = apiErr?.response?.data
      if (detail && typeof detail === 'object') {
        const firstError = Object.values(detail as Record<string, string | string[]>)[0]
        setError(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        setError('Unable to register. Please review your details.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-12 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-lg shadow-brand/10">
            <div className="mb-8 space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Join the platform</p>
              <h2 className="font-display text-3xl text-ink">Create a student account</h2>
              <p className="text-sm text-muted">
                Share a few details so mentors can design the right subjective MCQ experience for you.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-ink">First name</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  pattern="^[A-Za-z][A-Za-z\s'-]{1,48}$"
                  title="2-50 chars, letters/spaces/hyphens/apostrophes only"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Last name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  pattern="^[A-Za-z][A-Za-z\s'-]{1,48}$"
                  title="2-50 chars, letters/spaces/hyphens/apostrophes only"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  placeholder="+911234567890"
                  required
                />
                <p className="mt-1 text-xs text-muted">Use country code, digits only.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Qualification</label>
                <input
                  value={form.qualification}
                  onChange={(e) => updateField('qualification', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  placeholder="E.g., Grade 12, B.Tech, etc."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Interests & goals</label>
                <textarea
                  value={form.interests}
                  onChange={(e) => updateField('interests', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  rows={4}
                  placeholder="Share what excites you, dream roles, hobbies..."
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-brand py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              Already registered?{' '}
              <Link className="font-semibold text-brand" to="/auth/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden flex-col justify-between rounded-[2.5rem] border border-white/70 bg-white/80 p-10 shadow-glass backdrop-blur lg:flex">
          <BrandLogo />
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
              Designed for curious minds
            </p>
            <h1 className="font-display text-4xl text-ink">Share your story. Get an MCQ test built only for you.</h1>
            <p className="text-lg text-slate-600">
              Every answer provides context. Mentors decode it to recommend careers and draft actionable roadmaps.
            </p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/70 p-6">
            <p className="text-sm text-muted">Roadmap preview</p>
            <p className="font-display text-2xl text-ink">Step 1 · Explore Design Schools</p>
            <p className="text-sm text-muted">Curated resources • Mentor connect • Portfolio checklist</p>
          </div>
        </div>
      </div>
    </div>
  )
}
