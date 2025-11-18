import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

const studentLinks = [
  { label: 'Overview', to: '/dashboard', icon: '📊' },
  { label: 'Test Requests', to: '/dashboard/requests', icon: '📝' },
  { label: 'Tests', to: '/dashboard/tests', icon: '📋' },
  { label: 'Recommendations', to: '/dashboard/recommendations', icon: '🌱' },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#F5F7FF] text-ink">
      <div className="flex h-full min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur lg:flex">
          <BrandLogo />
          <nav className="mt-10 space-y-2">
            {studentLinks.map((link) => {
              const isActive = location.pathname === link.to || (link.to === '/dashboard/tests' && location.pathname.startsWith('/dashboard/tests/'))
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'text-muted hover:bg-slate-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={logout}
            className="mt-auto rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Log out
          </button>
        </aside>
        <main className="flex-1">
          <header className="flex flex-col gap-4 border-b border-white/70 bg-white/70 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Welcome back</p>
              <h1 className="font-display text-3xl text-ink">
                {user ? `${user.first_name} ${user.last_name}` : 'Student'}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                {user?.qualification ?? 'Learner'}
              </span>
              <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-muted">
                Role: {user?.role ?? 'student'}
              </span>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
