import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../lib/api'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAi } from '../../state/ai'

type FramePrediction = {
  pose_detected: boolean
  shot: string | null
  raw_shot?: string | null
  confidence: number | null
  stance?: string | null
  elbow_feedback?: string | null
  knee_feedback?: string | null
  total_score?: number | null
  elbow_angle?: number | null
  knee_angle?: number | null
}

declare global {
  interface Window {
    Pose?: any
  }
}

export function AiShotClassifierPage() {
  const { setMostFrequent } = useAi()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const overlayLoopRef = useRef<number | null>(null)
  const poseRef = useRef<any>(null)
  const overlayCleanupRef = useRef<null | (() => void)>(null)

  const sessionId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `sess-${Date.now()}`
  }, [])

  const [camOn, setCamOn] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [camStatus, setCamStatus] = useState<'idle' | 'requesting' | 'starting' | 'ready'>('idle')
  const [latest, setLatest] = useState<FramePrediction | null>(null)
  const [shotLog, setShotLog] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [poseOverlayOn, setPoseOverlayOn] = useState(true)
  const [overlayStatus, setOverlayStatus] = useState<
    | 'initializing'
    | 'ready'
    | 'no_landmarks'
    | 'asset_load_failed'
    | 'send_failed'
    | 'constructor_missing'
  >('initializing')
  const [overlayErrorShort, setOverlayErrorShort] = useState<string>('')

  const chartData = useMemo(() => {
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [counts])

  const mostFrequent = useMemo(() => {
    let best = ''
    let max = 0
    for (const [k, v] of Object.entries(counts)) {
      if (v > max) {
        max = v
        best = k
      }
    }
    return best
  }, [counts])

  useEffect(() => {
    if (mostFrequent) setMostFrequent(mostFrequent)
  }, [mostFrequent, setMostFrequent])

  const stopTracks = useCallback(() => {
    const v = videoRef.current
    if (v?.srcObject) {
      const stream = v.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      v.srcObject = null
    }
  }, [])

  const clearOverlay = useCallback(() => {
    const c = overlayRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
  }, [])

  const drawOverlayDebug = useCallback((text: string) => {
    const c = overlayRef.current
    const wrap = videoWrapRef.current
    if (!c || !wrap) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rect = wrap.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (c.width !== w) c.width = w
    if (c.height !== h) c.height = h

    ctx.clearRect(0, 0, c.width, c.height)
    ctx.save()
    ctx.shadowBlur = 14
    ctx.shadowColor = 'rgba(0, 229, 255, 0.65)'
    ctx.strokeStyle = 'rgba(0, 229, 255, 1)'
    ctx.lineWidth = Math.max(3, Math.round(3 * dpr))
    ctx.strokeRect(
      Math.round(6 * dpr),
      Math.round(6 * dpr),
      c.width - Math.round(12 * dpr),
      c.height - Math.round(12 * dpr),
    )

    const cx = c.width / 2
    const cy = c.height / 2
    ctx.beginPath()
    ctx.moveTo(cx - 10 * dpr, cy)
    ctx.lineTo(cx + 10 * dpr, cy)
    ctx.moveTo(cx, cy - 10 * dpr)
    ctx.lineTo(cx, cy + 10 * dpr)
    ctx.stroke()

    ctx.shadowColor = 'rgba(0, 255, 171, 0.8)'
    ctx.fillStyle = 'rgba(0, 255, 171, 1)'
    ctx.font = `${Math.max(12, Math.round(12 * dpr))}px ui-sans-serif, system-ui`
    ctx.fillText(text, Math.round(12 * dpr), Math.round(22 * dpr))
    ctx.restore()
  }, [])

  const stopPoseOverlay = useCallback(() => {
    overlayCleanupRef.current?.()
    overlayCleanupRef.current = null
    if (overlayLoopRef.current != null) {
      window.cancelAnimationFrame(overlayLoopRef.current)
      overlayLoopRef.current = null
    }
    try {
      poseRef.current?.close?.()
    } catch {
      // ignore
    }
    poseRef.current = null
    clearOverlay()
  }, [clearOverlay])

  const startCamera = async () => {
    setError(null)
    setCamStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      if (videoRef.current) {
        setCamStatus('starting')
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamOn(true)
      setCamStatus('ready')
    } catch {
      setError(
        'Camera permission denied or unavailable. Use https:// or localhost and allow the webcam.',
      )
      setCamOn(false)
      setCamStatus('idle')
    }
  }

  const stopCamera = useCallback(() => {
    setRunning(false)
    stopTracks()
    setCamOn(false)
    setCamStatus('idle')
    stopPoseOverlay()
  }, [stopTracks, stopPoseOverlay])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  useEffect(() => {
    if (!camOn || !poseOverlayOn) {
      stopPoseOverlay()
      return
    }

    let cancelled = false

    const ensureCanvasSize = () => {
      const wrap = videoWrapRef.current
      const canvas = overlayRef.current
      if (!wrap || !canvas) return
      const rect = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
    }

    const draw = (landmarks: Array<{ x: number; y: number; visibility?: number }>) => {
      const canvas = overlayRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ensureCanvasSize()
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      ctx.save()
      const dpr = window.devicePixelRatio || 1
      ctx.lineWidth = Math.max(3, Math.round(dpr * 3))
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowBlur = 8
      ctx.shadowColor = 'rgba(0,229,255,0.85)'

      const toXY = (lm: { x: number; y: number }) => {
        const x = (1 - lm.x) * w
        const y = lm.y * h
        return { x, y }
      }

      const visOk = (i: number) => {
        const v = landmarks[i]?.visibility
        return v == null || v > 0.35
      }

      const connect = (a: number, b: number) => {
        if (!landmarks[a] || !landmarks[b]) return
        if (!visOk(a) || !visOk(b)) return
        const A = toXY(landmarks[a])
        const B = toXY(landmarks[b])
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.lineTo(B.x, B.y)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(0,229,255,0.9)'
      const edges: Array<[number, number]> = [
        [11, 12],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
        [11, 23],
        [12, 24],
        [23, 24],
        [23, 25],
        [25, 27],
        [24, 26],
        [26, 28],
        [0, 11],
        [0, 12],
      ]
      edges.forEach(([a, b]) => connect(a, b))

      ctx.shadowColor = 'rgba(0,255,171,0.85)'
      ctx.fillStyle = 'rgba(0,255,171,1)'
      const points = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
      for (const i of points) {
        const lm = landmarks[i]
        if (!lm) continue
        if (!visOk(i)) continue
        const p = toXY(lm)
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(4, Math.round(dpr * 4.5)), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    const run = async () => {
      try {
        setOverlayStatus('initializing')
        setOverlayErrorShort('')

        const waitForPoseCtor = async () => {
          let tries = 0
          while (!window.Pose && tries < 20) {
            await new Promise((r) => setTimeout(r, 150))
            tries++
          }
          if (!window.Pose) {
            throw new Error('MediaPipe Pose constructor missing after script load')
          }
        }

        const ensurePoseScript = async () => {
          if (window.Pose) return

          const scriptSrc = '/mediapipe/pose/pose.js'
          const existing = document.querySelector(
            `script[src="${scriptSrc}"]`,
          ) as HTMLScriptElement | null

          if (existing) {
            if (window.Pose) return

            await new Promise<void>((resolve, reject) => {
              const onLoad = () => resolve()
              const onError = () => reject(new Error('Failed to load pose.js'))

              existing.addEventListener('load', onLoad, { once: true })
              existing.addEventListener('error', onError, { once: true })

              setTimeout(() => resolve(), 0)
            })

            await waitForPoseCtor()
            return
          }

          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = scriptSrc
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load pose.js'))
            document.head.appendChild(script)
          })

          await waitForPoseCtor()
        }

        try {
          await ensurePoseScript()
        } catch (e) {
          console.error('[Smart Cricket] Pose browser script load failed:', e)
          const msg = e instanceof Error ? e.message : String(e)
          setOverlayErrorShort(msg.slice(0, 160))
          setOverlayStatus('asset_load_failed')
          drawOverlayDebug('Overlay: asset load failed')
          return
        }

        if (cancelled) return

        const PoseCtor = window.Pose
        if (!PoseCtor) {
          console.error('[Smart Cricket] MediaPipe Pose constructor missing on window')
          setOverlayErrorShort('MediaPipe Pose constructor missing on window')
          setOverlayStatus('constructor_missing')
          drawOverlayDebug('Overlay: constructor missing')
          return
        }

        const locateFile = (file: string) => `/mediapipe/pose/${file}`

        let pose: any
        try {
          pose = new PoseCtor({ locateFile })
        } catch (err) {
          console.error('[Smart Cricket] Pose constructor found but instantiation failed', err)
          setOverlayErrorShort('MediaPipe Pose constructor instantiation failed')
          setOverlayStatus('constructor_missing')
          drawOverlayDebug('Overlay: constructor missing')
          return
        }

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        drawOverlayDebug('Overlay: initializing')

        try {
          if (typeof pose.initialize === 'function') {
            await pose.initialize()
          }

          await new Promise((r) => setTimeout(r, 150))

          if (import.meta.env.DEV) {
            console.info('[Smart Cricket] Pose overlay ready')
          }

          setOverlayStatus('no_landmarks')
          drawOverlayDebug('Overlay: no landmarks')
        } catch (e) {
          console.error('[Smart Cricket] Pose overlay asset initialization failed:', e)
          const msg = e instanceof Error ? e.message : String(e)
          setOverlayErrorShort(msg.slice(0, 160))
          setOverlayStatus('asset_load_failed')
          drawOverlayDebug('Overlay: asset load failed')
          return
        }

        pose.onResults((results: any) => {
          if (cancelled) return
          const lms = results?.poseLandmarks
          if (Array.isArray(lms) && lms.length) {
            setOverlayStatus('ready')
            draw(lms)
          } else {
            setOverlayStatus('no_landmarks')
            drawOverlayDebug('Overlay: no landmarks')
          }
        })

        poseRef.current = pose

        const loop = async () => {
          const video = videoRef.current
          if (cancelled || !video || !poseRef.current) return

          ensureCanvasSize()

          if (video.readyState >= 2) {
            try {
              await poseRef.current.send({ image: video })
            } catch (e) {
              console.warn('[Smart Cricket] Pose overlay send() failed:', e)
              const msg = e instanceof Error ? e.message : String(e)
              setOverlayErrorShort(msg.slice(0, 160))
              setOverlayStatus('send_failed')
              drawOverlayDebug('Overlay: send failed')
            }
          } else {
            drawOverlayDebug('Overlay: initializing')
          }

          overlayLoopRef.current = window.requestAnimationFrame(loop)
        }

        window.addEventListener('resize', ensureCanvasSize)
        ensureCanvasSize()
        overlayLoopRef.current = window.requestAnimationFrame(loop)

        overlayCleanupRef.current = () => {
          window.removeEventListener('resize', ensureCanvasSize)
        }
      } catch (e) {
        console.error('[Smart Cricket] Pose overlay failed to start:', e)
        const msg = e instanceof Error ? e.message : String(e)
        setOverlayErrorShort(msg.slice(0, 160))
        setOverlayStatus('asset_load_failed')
        drawOverlayDebug('Overlay: asset load failed')
      }
    }

    void run()

    return () => {
      cancelled = true
      stopPoseOverlay()
    }
  }, [camOn, poseOverlayOn, stopPoseOverlay, clearOverlay, drawOverlayDebug])

  const captureAndSend = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !running) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    await new Promise<void>((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            resolve()
            return
          }
          try {
            const form = new FormData()
            form.append('frame', blob, 'frame.jpg')
            const resp = await api.post<FramePrediction | { error?: string; details?: string }>(
              '/api/ai/predict-frame',
              form,
              {
                headers: {
                  'X-Session-Id': sessionId,
                },
                validateStatus: () => true,
                timeout: 60000,
              },
            )
            if (resp.status >= 400) {
              const d = resp.data as { error?: string; details?: string }
              const parts = [d?.error, d?.details].filter(Boolean)
              setError(parts.join(' — ') || `Request failed (${resp.status})`)
            } else {
              setError(null)
              const data = resp.data as FramePrediction
              setLatest(data)
              if (data.pose_detected && data.shot) {
                setShotLog((prev) => [...prev.slice(-99), data.shot!])
                setCounts((c) => ({ ...c, [data.shot!]: (c[data.shot!] || 0) + 1 }))
              }
            }
          } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
              const d = err.response?.data as { error?: string; details?: string } | undefined
              const msg =
                d?.error ||
                (typeof err.response?.data === 'string' ? err.response.data : null) ||
                (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
                  ? 'Network error — we could not reach the analysis service. Please try again in a moment.'
                  : null)
              setError(msg ? String(msg) : err.message || 'Request failed')
            }
          } finally {
            resolve()
          }
        },
        'image/jpeg',
        0.85,
      )
    })
  }, [running, sessionId])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      void captureAndSend()
    }, 280)
    return () => window.clearInterval(id)
  }, [running, captureAndSend])

  const saveSession = async () => {
    if (!shotLog.length) return
    try {
      await api.post('/api/ai/live-session', { shots: shotLog })
    } catch {
      // non-fatal
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass glow-border rounded-2xl p-6">
        <div className="text-2xl font-bold text-white">AI Shot Classifier</div>
        <div className="mt-2 text-sm text-white/70">
          Use your webcam to analyze your batting shots in real-time and get instant AI predictions.
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
        <Card
          title="Start your camera to begin live shot detection."
          subtitle="We’ll track your pose and classify each shot as you play."
        >
          <div className="space-y-4">
            <div
              ref={videoWrapRef}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40"
            >
              <video
                ref={videoRef}
                className="relative z-0 h-auto w-full scale-x-[-1] object-cover"
                playsInline
                muted
              />
              <canvas
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-white/60">
                Align your body within the frame for better tracking.
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/70">
                  Overlay:{' '}
                  <span className="font-semibold text-white">
                    {overlayStatus === 'initializing'
                      ? 'initializing'
                      : overlayStatus === 'ready'
                        ? 'ready'
                        : overlayStatus === 'no_landmarks'
                          ? 'no landmarks'
                          : overlayStatus === 'constructor_missing'
                            ? 'constructor missing'
                            : overlayStatus === 'asset_load_failed'
                              ? 'asset load failed'
                              : 'send failed'}
                  </span>
                </span>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/60"
                  onClick={() => setPoseOverlayOn((v) => !v)}
                  type="button"
                >
                  {poseOverlayOn ? 'Hide overlay' : 'Show overlay'}
                </button>
              </div>
            </div>

            {overlayStatus === 'asset_load_failed' && overlayErrorShort ? (
              <div className="text-xs text-red-200/90">{overlayErrorShort}</div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {!camOn ? (
                <Button
                  type="button"
                  onClick={() => void startCamera()}
                  loading={camStatus === 'requesting' || camStatus === 'starting'}
                >
                  Start Live Analysis
                </Button>
              ) : (
                <>
                  {!running ? (
                    <Button type="button" onClick={() => setRunning(true)}>
                      Begin analysis
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => setRunning(false)}>
                      Pause
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      void saveSession()
                      stopCamera()
                      setLatest(null)
                    }}
                  >
                    Stop & save session
                  </Button>
                </>
              )}
            </div>

            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {camStatus === 'starting' ? (
              <div className="text-sm text-white/60">Starting camera...</div>
            ) : camStatus === 'requesting' ? (
              <div className="text-sm text-white/60">Waiting for camera access...</div>
            ) : running ? (
              <div className="text-sm text-white/60">Analyzing movement...</div>
            ) : null}

            {latest?.pose_detected ? (
              <div className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-white/60">Shot (smoothed)</span>
                  <span className="font-bold text-neon-green">{latest.shot}</span>
                </div>
                {latest.confidence != null ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-white/60">Confidence</span>
                    <span className="text-white">{latest.confidence.toFixed(3)}</span>
                  </div>
                ) : null}
                {latest.stance ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-white/60">Stance</span>
                    <span className="text-white">{latest.stance}</span>
                  </div>
                ) : null}
                {latest.total_score != null ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-white/60">Form score</span>
                    <span className="text-white">{latest.total_score}%</span>
                  </div>
                ) : null}
                {(latest.elbow_feedback || latest.knee_feedback) && (
                  <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-white/80">
                    {latest.elbow_feedback ? <div>{latest.elbow_feedback}</div> : null}
                    {latest.knee_feedback ? <div>{latest.knee_feedback}</div> : null}
                  </div>
                )}
              </div>
            ) : latest && !latest.pose_detected ? (
              <div className="text-sm text-white/50">
                No player detected. Step into frame to begin analysis.
              </div>
            ) : (
              <div className="text-sm text-white/50">Start live analysis to view predictions.</div>
            )}
          </div>
        </Card>

        <div className="min-w-0">
          <Card
            title="Shot distribution"
            subtitle={mostFrequent ? `Most frequent: ${mostFrequent}` : 'Counts from live frames'}
          >
            <div className="h-[280px] w-full min-h-[280px] min-w-0">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10,10,10,0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="rgba(0,255,171,0.85)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/50">
                  Your shot breakdown will appear here as you play.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Recent predictions"
        subtitle="Recent predictions from your latest movements will be displayed here."
      >
        {shotLog.length ? (
          <div className="max-h-[220px] overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-black/40 backdrop-blur">
                <tr className="text-white/70">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Shot</th>
                </tr>
              </thead>
              <tbody>
                {[...shotLog]
                  .slice(-40)
                  .reverse()
                  .map((p, idx) => (
                    <tr key={`${shotLog.length}-${idx}`} className="border-t border-white/10">
                      <td className="px-3 py-2 text-white/60">{shotLog.length - idx}</td>
                      <td className="px-3 py-2 font-semibold text-white">{p}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-white/60">
            Recent predictions from your latest movements will be displayed here.
          </div>
        )}
      </Card>
    </div>
  )
}
