import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../features/application/application.css'
import { isSandboxed } from './isSandboxed'
import { EmbeddedOnly, SandboxPage } from './SandboxPage'

// The glob keys are the allow-list: only files Hermes wrote there can load.
const pages = import.meta.glob('../features/application/generated/*.tsx')
const page = new URLSearchParams(location.search).get('page')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSandboxed(window.origin) ? (
      <SandboxPage
        load={pages[`../features/application/generated/${page}.tsx`]}
      />
    ) : (
      <EmbeddedOnly />
    )}
  </StrictMode>,
)
