import React, { createContext, useContext, useMemo, useState } from 'react'

type User = { id: string; username: string; email: string }
type AuthState = {
  token: string | null
  user: User | null
  setAuth: (next: { token: string; user: User }) => void
  logout: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

const LS_TOKEN = 'smartcricket.token'
const LS_USER = 'smartcricket.user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LS_TOKEN))
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(LS_USER)
    return raw ? (JSON.parse(raw) as User) : null
  })

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      setAuth: ({ token: t, user: u }) => {
        localStorage.setItem(LS_TOKEN, t)
        localStorage.setItem(LS_USER, JSON.stringify(u))
        setToken(t)
        setUser(u)
      },
      logout: () => {
        localStorage.removeItem(LS_TOKEN)
        localStorage.removeItem(LS_USER)
        setToken(null)
        setUser(null)
      },
    }),
    [token, user],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

