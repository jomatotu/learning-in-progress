const storageKey = 'lip-student-id'
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

let current: string | undefined

// One id per browser, so the server can keep notes on this student across sessions. Only the id is stored.
export function studentId(): string {
  if (current) return current
  try {
    const stored = localStorage.getItem(storageKey)
    current = stored && uuidPattern.test(stored) ? stored : crypto.randomUUID()
    localStorage.setItem(storageKey, current)
  } catch {
    // Storage can be blocked; the id then lasts until the page reloads.
    current ??= crypto.randomUUID()
  }
  return current
}
