import { request } from '@/api/client'
import type { StudentProfile } from '@/api/profile'

// What POST /api/solution returns: the URL of the just-created Solution Page.
export type SolutionReply = { url: string }

// Asks the backend to have Hermes build this student's Solution Page; resolves with the page URL.
export async function generateSolution(
  profileJson: StudentProfile,
): Promise<SolutionReply> {
  return request<SolutionReply>('/solution', {
    method: 'POST',
    body: { profile: profileJson },
    timeoutMs: 900_000,
  })
}
