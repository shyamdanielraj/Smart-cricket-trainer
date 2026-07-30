import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { ModelViewer } from '../components/ModelViewer'
import { fetchBattingStyles, mapPredictionToStyleId } from '../../lib/modelsManifest'
import type { BattingStyle } from '../../lib/modelsManifest'
import { useAi } from '../../state/ai'

export function BattingLabPage() {
  const { lastPredictionMostFrequent } = useAi()
  const [styles, setStyles] = useState<BattingStyle[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBattingStyles()
      .then((s) => {
        setStyles(s)
        setSelectedId(s[0]?.id || '')
      })
      .catch((e) => setError(String(e?.message || e)))
  }, [])

  useEffect(() => {
    if (!styles.length || !lastPredictionMostFrequent) return
    const id = mapPredictionToStyleId(lastPredictionMostFrequent, styles)
    if (id) setSelectedId(id)
  }, [lastPredictionMostFrequent, styles])

  const selected = useMemo(() => styles.find((s) => s.id === selectedId) || null, [styles, selectedId])
  const url = selected ? `/models/${selected.file}` : '/models/default.glb'

  return (
    <div className="space-y-6">
      <div className="glass glow-border rounded-2xl p-6">
        <div className="text-2xl font-bold text-white">3D Batting Lab</div>
        <div className="mt-2 text-sm text-white/70">
          Explore your predicted batting style in a fully interactive 3D environment.
        </div>
        {lastPredictionMostFrequent ? (
          <div className="mt-3 text-sm text-white/70">
            Based on your latest analysis:{' '}
            <span className="font-semibold text-neon-green">{lastPredictionMostFrequent}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card
          title="Choose a batting style to explore in 3D."
          subtitle="Compare different techniques and improve your form with visual feedback."
        >
          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="mt-2">
            <label className="text-xs font-semibold text-white/70">Batting style</label>
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-neon-cyan/60"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-white/50">Select a style to update the 3D view.</div>
          </div>

          {selected ? (
            <div className="mt-4 text-sm text-white/70">
              Includes:{' '}
              <span className="text-white/80">
                {(selected.predictionLabels?.length ? selected.predictionLabels : ['(none)']).join(', ')}
              </span>
            </div>
          ) : null}
        </Card>

        <Card title="3D View" subtitle="Interact with the 3D model to analyze movement, angles, and shot execution.">
          <ModelViewer modelUrl={url} />
        </Card>
      </div>
    </div>
  )
}

