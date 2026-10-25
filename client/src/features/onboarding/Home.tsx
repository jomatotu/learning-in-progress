import { ArrowRight, Sparkles, Volume2, BookOpen, Map } from 'lucide-react'
import { defineMessages, useMessages } from '@/lib/i18n'

type HomeProps = {
  onStart: () => void
}

const messages = defineMessages({
  de: {
    kicker: 'Lernen, das zu dir passt',
    title: 'Dein Wissen.',
    titleEm: 'Deine Form.',
    intro:
      'Wir verwandeln, was du lernen möchtest, in ein Werkzeug, das so denkt wie du. Fundiert, persönlich und direkt einsatzbereit.',
    start: "Los geht's",
    note: 'Dauert etwa 8 Minuten · Keine Vorkenntnisse nötig · Du siehst alles, was wir über dich wissen',
    tooMuchText: 'Zu viel Text',
    listen: 'Hör es dir an',
    connections: 'Sieh Zusammenhänge',
    adapts: 'Passt sich dir an',
  },
  en: {
    kicker: 'Learning that fits you',
    title: 'Your knowledge.',
    titleEm: 'Your shape.',
    intro:
      'We turn what you want to learn into a tool that thinks the way you do. Grounded, personal, and ready to use.',
    start: "Let's go",
    note: 'Takes about 8 minutes · No prior knowledge needed · You see everything we know about you',
    tooMuchText: 'Too much text',
    listen: 'Listen to it',
    connections: 'See the connections',
    adapts: 'Adapts to you',
  },
})

export function Home({ onStart }: HomeProps) {
  const t = useMessages(messages)

  return (
    <section className="screen home">
      <div className="home-copy">
        <span className="kicker">
          <Sparkles size={16} /> {t.kicker}
        </span>
        <h1>
          {t.title}
          <br />
          <em>{t.titleEm}</em>
        </h1>
        <p>{t.intro}</p>
        <button className="primary large" onClick={onStart}>
          {t.start} <ArrowRight />
        </button>
        <small>{t.note}</small>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="art-card card-a">
          <BookOpen />
          <span>{t.tooMuchText}</span>
        </div>
        <div className="art-card card-b">
          <Volume2 />
          <span>{t.listen}</span>
        </div>
        <div className="art-card card-c">
          <Map />
          <span>{t.connections}</span>
        </div>
        <div className="art-center">
          <Sparkles size={34} />
          <b>{t.adapts}</b>
        </div>
      </div>
    </section>
  )
}
