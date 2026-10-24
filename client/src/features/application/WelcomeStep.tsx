import { Clock, Eye, HeartHandshake } from 'lucide-react'

const promises = [
  {
    icon: Clock,
    title: 'About 10 minutes',
    text: 'Five short steps, including 30 quick questions about how you learn.',
  },
  {
    icon: HeartHandshake,
    title: 'No diagnosis needed',
    text: 'Describe how learning feels for you, in your own words.',
  },
  {
    icon: Eye,
    title: 'You stay in control',
    text: 'You see everything we know about you and can change it.',
  },
]

function WelcomeStep() {
  return (
    <div>
      <span className="kicker">Welcome</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[16ch] text-[2.2rem] md:text-[2.8rem]"
      >
        Let’s shape learning <em>around you</em>
      </h2>
      <p className="mt-4 max-w-[46ch] text-graphite">
        Tell us a little about yourself, what you want to reach, and what you’re
        learning. We use it to build a study tool that fits the way you learn.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {promises.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="rounded-2xl border border-rule bg-paper p-5"
          >
            <Icon className="size-6 text-pine" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 font-medium">{title}</p>
            <p className="mt-1 text-sm text-graphite">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { WelcomeStep }
