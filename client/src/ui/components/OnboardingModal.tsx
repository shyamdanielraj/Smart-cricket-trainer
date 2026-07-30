import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'

const LS_KEY = 'smartcricket_onboarding_seen'

type Step = {
  title: string
  text: string
  cta?: { label: string; to: string }
}

const steps: Step[] = [
  {
    title: 'Welcome to Smart Cricket',
    text: 'Analyze your batting with real-time AI feedback and interactive 3D visuals.',
  },
  {
    title: 'AI Shot Classifier',
    text: 'Use your webcam to detect and classify batting shots live.',
    cta: { label: 'Open AI Shot Classifier', to: '/ai' },
  },
  {
    title: '3D Batting Lab',
    text: 'Explore predicted shots and batting styles in 3D.',
    cta: { label: 'Open 3D Batting Lab', to: '/lab' },
  },
  {
    title: 'Match Insights',
    text: 'Review performance trends and deeper analytics as more features are added.',
    cta: { label: 'Open Match Insights', to: '/insights' },
  },
]

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)

  const step = useMemo(() => steps[Math.min(idx, steps.length - 1)], [idx])
  const isLast = idx >= steps.length - 1

  useEffect(() => {
    if (!isOpen) setIdx(0)
  }, [isOpen])

  const finish = () => {
    try {
      localStorage.setItem(LS_KEY, 'true')
    } catch {
      // ignore
    }
    onClose()
  }

  const skip = () => finish()

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
          onClick={finish}
        >
          <motion.div
            initial={{ y: 10, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="glass glow-border w-full max-w-xl rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Smart Cricket onboarding"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Getting started • Step {idx + 1} of {steps.length}
                </div>
                <div className="mt-1 text-xl font-bold text-white">{step.title}</div>
                <div className="mt-2 text-sm text-white/70">{step.text}</div>
              </div>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/60"
                onClick={finish}
              >
                Skip
              </button>
            </div>

            {step.cta ? (
              <div className="mt-4">
                <button
                  className="text-sm font-semibold text-neon-cyan transition hover:text-neon-green focus:outline-none focus:ring-2 focus:ring-neon-cyan/60 rounded-lg px-2 py-1"
                  onClick={() => {
                    navigate(step.cta!.to)
                  }}
                >
                  {step.cta.label}
                </button>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIdx((v) => Math.max(0, v - 1))}
                  disabled={idx === 0}
                >
                  Back
                </Button>
                {!isLast ? (
                  <Button type="button" onClick={() => setIdx((v) => Math.min(steps.length - 1, v + 1))}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={finish}>
                    Got it
                  </Button>
                )}
              </div>
              <button
                className="text-xs text-white/60 underline-offset-4 transition hover:text-white hover:underline"
                onClick={skip}
              >
                Skip onboarding
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

