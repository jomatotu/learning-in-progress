import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { registry } from './registry'

// Renders a lesson spec from Hermes; only catalog components can appear.
// `loading` while blocks still stream in, so outlined blocks that haven't landed yet are skipped quietly.
export function LessonView({
  spec,
  loading,
}: {
  spec: Spec
  loading?: boolean
}) {
  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} loading={loading} />
    </JSONUIProvider>
  )
}
