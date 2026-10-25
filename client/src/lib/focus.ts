import { createContext, use } from 'react'

// Focus mode: a spotlight follows the mouse and dims the rest of the page,
// so the student reads one block at a time (see FocusOverlay).
export const FocusContext = createContext<{
  focusMode: boolean
  setFocusMode: (focusMode: boolean) => void
}>({ focusMode: false, setFocusMode: () => {} })

export function useFocus() {
  return use(FocusContext)
}
