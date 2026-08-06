const STORAGE_KEY = 'florence_quality_tier'

export type QualityTier = 'high' | 'medium' | 'low'

interface QualityConfig {
  pixelRatio: number
  scale: number
  skipEffects: boolean
}

const TIERS: Record<QualityTier, QualityConfig> = {
  high: { pixelRatio: Math.min(window.devicePixelRatio, 2), scale: 1, skipEffects: false },
  medium: { pixelRatio: 1, scale: 0.75, skipEffects: false },
  low: { pixelRatio: 1, scale: 0.5, skipEffects: true },
}

const SAMPLE_FRAMES = 10
const RE_EVALUATE_INTERVAL = 120

export function createQualityTier() {
  let frames = 0
  let totalTime = 0
  let tier: QualityTier = loadSavedTier()
  let config = TIERS[tier]
  let lastFrameTime = performance.now()

  function loadSavedTier(): QualityTier {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'high' || saved === 'medium' || saved === 'low') return saved
    } catch { /* ignore */ }
    return 'medium'
  }

  function saveTier(t: QualityTier) {
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
  }

  function setTier(t: QualityTier) {
    if (t === tier) return
    tier = t
    config = TIERS[t]
    saveTier(t)
  }

  function getConfig() { return config }
  function getTier() { return tier }

  function frame() {
    const now = performance.now()
    const dt = now - lastFrameTime
    lastFrameTime = now

    if (frames < SAMPLE_FRAMES || frames % RE_EVALUATE_INTERVAL === 0) {
      frames++
      totalTime += dt

      if (frames === SAMPLE_FRAMES) {
        const avg = totalTime / SAMPLE_FRAMES
        if (avg < 16) setTier('high')
        else if (avg > 33) setTier('low')
        else setTier('medium')
      } else if (frames % RE_EVALUATE_INTERVAL === 0) {
        const avg = totalTime / RE_EVALUATE_INTERVAL
        if (avg < 16) setTier('high')
        else if (avg > 33) setTier('low')
        totalTime = 0
      }
    }
  }

  return { getConfig, getTier, frame }
}
