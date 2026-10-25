import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { registry } from './registry'

// Renders a lesson spec from Hermes; only catalog components can appear.
export function LessonView({ spec }: { spec: Spec }) {
  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  )
}
