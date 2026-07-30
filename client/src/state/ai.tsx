import React, { createContext, useContext, useMemo, useState } from 'react'

type AiState = {
  lastPredictionMostFrequent: string | null
  setMostFrequent: (v: string | null) => void
}

const AiCtx = createContext<AiState | null>(null)

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [lastPredictionMostFrequent, setMostFrequent] = useState<string | null>(null)
  const value = useMemo(() => ({ lastPredictionMostFrequent, setMostFrequent }), [lastPredictionMostFrequent])
  return <AiCtx.Provider value={value}>{children}</AiCtx.Provider>
}

export function useAi() {
  const ctx = useContext(AiCtx)
  if (!ctx) throw new Error('useAi must be used within AiProvider')
  return ctx
}

