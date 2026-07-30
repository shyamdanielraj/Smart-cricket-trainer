import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../state/auth'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

export function SignupPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan shadow-glow" />
          <div className="text-2xl font-bold text-white">Smart Cricket</div>
          <div className="text-sm text-white/60">Create your profile</div>
        </div>

        <Card title="Sign up" subtitle="Futuristic player profile + analytics history">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setLoading(true)
              try {
                const resp = await api.post('/api/auth/signup', { username, email, password })
                setAuth(resp.data)
                navigate('/')
              } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                  const msg =
                    err.response?.data?.error ||
                    (typeof err.response?.data === 'string' ? err.response.data : null)
                  if (msg) setError(String(msg))
                  else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error')
                    setError(
                      'Cannot reach API. Start the server and check VITE_API_BASE_URL in client/.env.',
                    )
                  else setError(err.message || 'Sign up failed')
                } else {
                  setError('Sign up failed')
                }
              } finally {
                setLoading(false)
              }
            }}
          >
            <div>
              <label className="text-xs font-semibold text-white/70">Username</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-neon-cyan/60"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="virat_18"
              />
              <div className="mt-1 text-xs text-white/50">Letters, numbers, underscore.</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-neon-cyan/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="virat@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Password</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-neon-cyan/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
              <div className="mt-1 text-xs text-white/50">Minimum 8 characters.</div>
            </div>
            {error ? <div className="text-sm text-red-300">{error}</div> : null}
            <Button loading={loading} type="submit" className="w-full">
              Create account
            </Button>
          </form>

          <div className="mt-4 text-sm text-white/60">
            Already have an account?{' '}
            <Link className="text-neon-cyan hover:underline" to="/login">
              Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

