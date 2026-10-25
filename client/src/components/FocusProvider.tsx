import { useEffect, useState, type ReactNode } from 'react'
import { FocusContext } from '@/lib/focus'
import { FocusOverlay } from '@/components/FocusOverlay'

// Holds the focus-mode switch for the whole site and renders the spotlight while it is on.
export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
  }, [focusMode])

  return (
    <FocusContext value={{ focusMode, setFocusMode }}>
      {children}
      {focusMode && <FocusOverlay />}
    </FocusContext>
  )
}
