import { useEffect, useState } from 'react'
import { readStoredLook, setLookAttribute, storeLook } from './look'

// Switches the whole app to the matte grey look (rules in index.css). Stays on after unmount on purpose.
function LookToggle() {
  const [on, setOn] = useState(readStoredLook)

  useEffect(() => {
    setLookAttribute(on)
    storeLook(on)
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
