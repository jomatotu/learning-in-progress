import type { Profile } from './profile'

// What POST /api/profile returns: the student's profile JSON, with the chosen instructions per category.
export type StudentProfileJson = Record<string, unknown>

// The form data in the shape the server expects. Survey answers go raw; the server does the scoring.
export function toProfileRequest(profile: Profile) {
  return {
    student: {
      name: profile.name,
      stage: profile.stage,
      stage_detail: profile.stageDetail,
      interests: profile.interests,
    },
    goal: {
      type: profile.goalType,
      in_their_words: profile.goal,
      deadline: profile.deadline || null,
    },
    material: {
      topic: profile.topic,
      texts: profile.texts,
      links: profile.links,
      files: profile.files.map((f) => f.name),
    },
    answers: profile.answers,
    preferences: {
      likes_learning_with: profile.likes,
      notes: profile.notes,
    },
  }
}

export async function createProfile(
  profile: Profile,
): Promise<StudentProfileJson> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toProfileRequest(profile)),
  })
  if (!response.ok)
    throw new Error(`Profile request failed: ${response.status}`)
  return response.json()
}
