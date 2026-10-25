const storageKey = 'lip-look'
const lookValue = 'graustufen'

function readStoredLook(): boolean {
  try {
    return localStorage.getItem(storageKey) === lookValue
  } catch {
    return false
  }
}

function setLookAttribute(on: boolean) {
  const root = document.documentElement
  if (on) root.setAttribute('data-look', lookValue)
  else root.removeAttribute('data-look')
}

function storeLook(on: boolean) {
  try {
    if (on) localStorage.setItem(storageKey, lookValue)
    else localStorage.removeItem(storageKey)
  } catch {
    // Storage can be blocked; the look still applies for this page.
  }
}

// Called once before the first render so deep links and reloads do not flash colour.
function applyStoredLook() {
  setLookAttribute(readStoredLook())
}

export { applyStoredLook, readStoredLook, setLookAttribute, storeLook }
