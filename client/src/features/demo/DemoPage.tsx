import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { defineMessages, useMessages } from '@/lib/i18n'
import { Topbar } from '../onboarding/Topbar'
import { personas } from './personas'

const messages = defineMessages({
  en: {
    kicker: 'Demo',
    title: 'Pick a student,',
    titleEm: 'watch Morph build.',
    hint: 'Each link opens the form already filled in. Click “Build my tool” and Morph does the rest live.',
  },
  de: {
    kicker: 'Demo',
    title: 'Wähl eine Person,',
    titleEm: 'Morph baut live.',
    hint: 'Jeder Link öffnet das fertig ausgefüllte Formular. Klick auf „Mein Werkzeug bauen“, den Rest macht Morph live.',
  },
})

// The /demo page for the jury: one card per persona, each a one-click link into the filled-in form.
export function DemoPage() {
  const t = useMessages(messages)
  const navigate = useNavigate()

  return (
    <main className="app-shell">
      <Topbar step={0} onHome={() => navigate('/')} />
      <section className="mx-auto w-full max-w-5xl p-5 md:px-8 md:py-10">
        <span className="kicker">{t.kicker}</span>
        <h1 className="mt-1.5 text-[1.9rem] md:text-[2.4rem]">
          {t.title} <em>{t.titleEm}</em>
        </h1>
        <p className="mt-1 max-w-prose text-graphite">{t.hint}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {personas.map((persona) => {
            const href = `/?demo=${persona.id}`
            return (
              <li key={persona.id}>
                <Link
                  to={href}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-rule p-5 transition-colors hover:border-ink focus-visible:border-ink"
                >
                  <span className="text-2xl">{persona.profile.name}</span>
                  <span className="text-graphite">{persona.line}</span>
                  <span className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-pine-deep">
                    {href}
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
