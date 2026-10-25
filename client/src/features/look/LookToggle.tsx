import { useEffect, useState } from 'react'

const storageKey = 'lip-look'
const lookValue = 'graustufen'

function loadChoice(): boolean {
  try {
    return localStorage.getItem(storageKey) === lookValue
  } catch {
    return false
  }
}

// Switches the whole app to the matte grey look (rules in index.css). Stays on after unmount on purpose.
function LookToggle() {
  const [on, setOn] = useState(loadChoice)

  useEffect(() => {
    const root = document.documentElement
    if (on) root.setAttribute('data-look', lookValue)
    else root.removeAttribute('data-look')
    try {
      if (on) localStorage.setItem(storageKey, lookValue)
      else localStorage.removeItem(storageKey)
    } catch {
      // Storage can be blocked; the look still applies for this page.
    }
  }, [on])

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((current) => !current)}
      className="look-toggle"
    >
      Graustufen
    </button>
  )
}

export { LookToggle }
