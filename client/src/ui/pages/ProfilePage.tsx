import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../state/auth'
import { Card } from '../components/Card'

type HistoryItem = {
  id: string
  createdAt: string
  datasetName: string
  modelName: string
  mostFrequent: string
  counts: Record<string, number>
}

export function ProfilePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/api/ai/history')
      .then((r) => setItems(r.data.items as HistoryItem[]))
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load history'))
  }, [])

  return (
    <div className="space-y-6">
      <div className="glass glow-border rounded-2xl p-6">
        <div className="text-2xl font-bold text-white">Profile</div>
        <div className="mt-2 text-sm text-white/70">
          <span className="font-semibold text-white">{user?.username}</span> • {user?.email}
        </div>
      </div>

      <Card title="Prediction History" subtitle="Saved per user in MongoDB">
        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}
        {items.length ? (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">{it.mostFrequent || '—'}</div>
                  <div className="text-xs text-white/50">{new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Dataset: {it.datasetName || '—'} • Model: {it.modelName || '—'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(it.counts || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70"
                      >
                        {k}: <span className="font-semibold text-white">{v}</span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/60">No data yet. Start a session to see your shot analysis.</div>
        )}
      </Card>
    </div>
  )
}
