import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { setApiToken } from '../../lib/api'
import { OnboardingModal } from '../components/OnboardingModal'

const ONBOARDING_KEY = 'smartcricket_onboarding_seen'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/ai', label: 'AI Shot Classifier' },
  { to: '/lab', label: '3D Batting Lab' },
  { to: '/insights', label: 'Match Insights' },
  { to: '/profile', label: 'Profile' },
]

export function DashboardLayout() {
  const { token, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const navigate = useNavigate()

  useEffect(() => setApiToken(token), [token])

  useEffect(() => {
    if (!user) return
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
      if (!seen) setShowOnboarding(true)
    } catch {
      // if storage is blocked, default to not showing repeatedly
    }
  }, [user])

  const initials = useMemo(() => {
    const u = user?.username || 'SC'
    return u.slice(0, 2).toUpperCase()
  }, [user?.username])

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan shadow-glow" />
            <div>
              <div className="text-lg font-bold tracking-tight text-white">Smart Cricket</div>
              <div className="text-xs text-white/60">AI analytics + 3D batting lab</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              className="md:hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
            <button
              className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left hover:bg-white/10"
              onClick={() => navigate('/profile')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-neon-cyan">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{user?.username}</div>
                <div className="text-xs text-white/60">{user?.email}</div>
              </div>
            </button>
            <button
              className="hidden md:inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <aside className="hidden md:block">
            <Sidebar />
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              className="h-full w-[320px] max-w-[90vw] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass glow-border h-full rounded-2xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Navigation</div>
                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <Sidebar onNavigate={() => setOpen(false)} />
                <div className="mt-5 border-t border-white/10 pt-4">
                  <button
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="glass glow-border rounded-2xl p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
        Dashboard
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 text-white border border-white/10'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
            end={n.to === '/'}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

