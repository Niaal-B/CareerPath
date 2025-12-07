import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { label: 'Dashboard', to: '/admin', icon: '📈' },
  { label: 'Requests', to: '/admin/requests', icon: '🧾' },
  { label: 'Question Builder', to: '/admin/questions', icon: '✍️' },
  { label: 'Question Bank', to: '/admin/question-bank', icon: '🗂️' },
  { label: 'Reviews', to: '/admin/reviews', icon: '🧐' },
  { label: 'Resources', to: '/admin/resources', icon: '📚' },
  { label: 'Companies', to: '/admin/companies', icon: '🏢' },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="flex h-full min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-white/10 bg-black/40 p-6 backdrop-blur lg:flex">
          <BrandLogo />
          <nav className="mt-10 space-y-2">
            {adminLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-white/10 text-white shadow-lg shadow-brand/20' : 'text-slate-300 hover:bg-white/5'
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
            className="mt-auto rounded-2xl border border-white/20 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-brand hover:text-brand"
          >
            Log out
          </button>
        </aside>
        <main className="flex-1 bg-gradient-to-b from-[#0F172A] via-[#151F35] to-[#0F172A]">
          <header className="flex flex-col gap-4 border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">Admin workspace</p>
              <h1 className="font-display text-3xl text-white">{user ? `${user.first_name} ${user.last_name}` : 'Admin'}</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/30 px-4 py-2 text-sm text-slate-200">
                Role: {user?.role ?? 'admin'}
              </span>
              <span className="rounded-full bg-brand/20 px-4 py-2 text-sm font-semibold text-white">
                {user?.email}
              </span>
            </div>
          </header>
          <div className="p-6 text-white">{children}</div>
        </main>
      </div>
    </div>
  )
}
