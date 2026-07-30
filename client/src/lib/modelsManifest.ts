export type BattingStyle = {
  id: string
  label: string
  file: string
  predictionLabels: string[]
}

function labelFromFilename(file: string): string {
  const base = String(file || '')
    .trim()
    .replace(/^.*\//, '')
    .replace(/\.(glb|gltf)$/i, '')
  if (!base) return 'Default Stance'
  if (base.toLowerCase() === 'default') return 'Default Stance'
  return base
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function fetchBattingStyles(): Promise<BattingStyle[]> {
  const resp = await fetch('/models/manifest.json', { cache: 'no-store' })
  if (!resp.ok) throw new Error('We couldn’t load the 3D batting styles library.')
  const data = (await resp.json()) as { styles?: BattingStyle[] }
  if (!data.styles || !Array.isArray(data.styles)) throw new Error('The 3D batting styles library is unavailable right now.')
  return data.styles.map((s) => ({
    ...s,
    label: (s as { label?: string }).label?.trim() ? String((s as { label?: string }).label) : labelFromFilename(s.file),
    predictionLabels: Array.isArray(s.predictionLabels) ? s.predictionLabels : [],
  }))
}

export function mapPredictionToStyleId(prediction: string, styles: BattingStyle[]): string {
  const p = prediction?.trim()
  const direct = styles.find((s) => s.predictionLabels?.includes(p))
  return direct?.id || styles[0]?.id || 'default-style'
}

