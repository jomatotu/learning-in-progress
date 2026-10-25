// The curves a Lab may use. Fixed and parameterized: the spec picks a curve and numbers, never code.

export type Effect = 'saturating' | 'linear' | 'optimum'

export interface LabSlider {
  key?: string
  label?: string
  unit?: string
  min: number
  max: number
  step?: number
  value?: number
  effect?: Effect
  k?: number
  width?: number
}

const clamp01 = (n: number) =>
  Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0

// How strongly one factor at value x drives the output, from 0 to 1.
export function effect(slider: Omit<LabSlider, 'key'>, x: number): number {
  const span = slider.max - slider.min || 1
  const t = clamp01((x - slider.min) / span)
  if (slider.effect === 'saturating') {
    // Rises steeply, then levels off; k is where it has done about half its rise. f(min) = 0, f(max) = 1.
    const k =
      clamp01(((slider.k ?? slider.min + span / 4) - slider.min) / span) || 0.25
    return clamp01((t * (1 + k)) / (t + k))
  }
  if (slider.effect === 'optimum') {
    const center = slider.k ?? slider.min + span / 2
    const width = slider.width || span / 4
    return clamp01(Math.exp(-(((x - center) / width) ** 2)))
  }
  return t
}
