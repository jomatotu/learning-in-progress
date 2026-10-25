import { validateSpec, type Spec } from '@json-render/core'
import { request } from '@/api/client'
import type { StudentProfile } from '@/api/profile'

// What POST /api/solution returns: the student's lesson as a json-render spec for our catalog.
export type SolutionReply = { spec: Spec }

// Asks the backend to have Hermes build this student's lesson; resolves with its spec.
export async function generateSolution(
  profileJson: StudentProfile,
): Promise<SolutionReply> {
  const reply = await request<SolutionReply>('/solution', {
    method: 'POST',
    body: { profile: profileJson },
    timeoutMs: 900_000,
  })
  // The server checks the spec too; this keeps a broken one from rendering as a blank page.
  if (!validateSpec(reply.spec).valid) throw new Error('invalid_spec')
  return reply
}
