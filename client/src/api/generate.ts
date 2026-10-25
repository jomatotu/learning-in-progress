import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { applySpecPatch, type JsonPatch, type Spec } from '@json-render/core'
import type { Answer, Profile, ThemeName } from '@/api/assess'
import { streamResult, type StreamProgress } from '@/api/client'
import { useStreamProgress } from '@/api/progress'
import { studentId } from '@/api/studentId'

// "spec" streams json-render blocks (the default); "html" has Hermes write a whole sandboxed page.
export type PageFormat = 'spec' | 'html'

export type GenerateInput = {
  profile: Profile
  answers: Answer[]
  material: string
  // The theme to build; the server uses "chunked" when it's left out.
  theme?: ThemeName
  format?: PageFormat
}

export type BuiltPage = { spec: Spec } | { html: string }

// Streams the generation: reports Hermes's progress and each block (or the page so far) as it lands, then resolves
// with the finished lesson or page.
export function generatePage(
  input: GenerateInput,
  progress: StreamProgress,
): Promise<BuiltPage> {
  return streamResult('/generate', {
    body: { ...input, student_id: studentId() },
    ...progress,
  })
}

// Applies one streamed patch to a copy, so React sees a new spec. The server only sends /root and /elements/<key>.
export function withPatch(spec: Spec | null, patch: JsonPatch): Spec {
  const base = spec ?? { root: '', elements: {} }
  return applySpecPatch({ ...base, elements: { ...base.elements } }, patch)
}

export function useGeneratePage() {
  const progress = useStreamProgress()
  // The lesson so far, so the student sees each block the moment Hermes finishes it.
  const [partial, setPartial] = useState<Spec | null>(null)
  // The half-written HTML page, for the html format.
  const [preview, setPreview] = useState('')
  const mutation = useMutation({
    mutationFn: (input: GenerateInput) => {
      progress.reset()
      setPartial(null)
      setPreview('')
      return generatePage(input, {
        ...progress.callbacks,
        onPatch: (patch) => setPartial((spec) => withPatch(spec, patch)),
        onPreview: setPreview,
      })
    },
  })
  const data = mutation.data
  return {
    ...mutation,
    status: progress.status,
    reasoning: progress.reasoning,
    spec: data && 'spec' in data ? data.spec : partial,
    html: data && 'html' in data ? data.html : undefined,
    preview,
  }
}
