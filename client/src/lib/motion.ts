// No movement for students who asked for less motion, or in the still Graustufen look.
export function prefersStill(): boolean {
  return (
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false) ||
    document.documentElement.dataset.look === 'graustufen'
  )
}
