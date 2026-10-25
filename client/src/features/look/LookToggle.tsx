import { useEffect, useState } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { readStoredLook, setLookAttribute, storeLook } from './look'

const messages = defineMessages({
  en: { label: 'Greyscale' },
  de: { label: 'Graustufen' },
})

// Switches the whole app to the matte grey look (rules in index.css). Stays on after unmount on purpose.
function LookToggle() {
  const [on, setOn] = useState(readStoredLook)
  const t = useMessages(messages)

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
      {t.label}
    </button>
  )
}

export { LookToggle }
