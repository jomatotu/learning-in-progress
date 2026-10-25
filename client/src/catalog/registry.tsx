// Maps catalog component names to their blocks; Hermes' specs render only through this.
import { defineRegistry } from '@json-render/react'
import { catalog } from './catalog'
import { Card, Flashcard, Original, Quiz, ReadAloud, SafeBlock } from './blocks'
import { Lab } from './Lab'

export const { registry } = defineRegistry(catalog, {
  components: {
    Lesson: ({ props, children }) => (
      <article className="grid gap-6">
        <h2 className="text-3xl font-semibold tracking-tight text-ink">
          {props.title}
        </h2>
        {children}
      </article>
    ),
    Chunk: ({ props }) => (
      <SafeBlock>
        <Card>
          <h3 className="text-xl font-semibold">{props.heading}</h3>
          <p className="mt-3 text-lg leading-relaxed">{props.text}</p>
          <Original source={props.source} />
        </Card>
      </SafeBlock>
    ),
    Flashcard: ({ props }) => (
      <SafeBlock>
        <Flashcard {...props} />
      </SafeBlock>
    ),
    Quiz: ({ props }) => (
      <SafeBlock>
        <Quiz {...props} />
      </SafeBlock>
    ),
    ReadAloud: ({ props }) => (
      <SafeBlock>
        <ReadAloud {...props} />
      </SafeBlock>
    ),
    Steps: ({ props }) => (
      <SafeBlock>
        <Card>
          <h3 className="text-xl font-semibold">{props.title}</h3>
          <ol className="mt-4 grid list-decimal gap-3 pl-6 text-lg marker:font-semibold marker:text-pine">
            {(props.steps ?? []).map((step, i) => (
              <li key={i} className="pl-1">
                <span className="font-semibold">{step.label}</span>
                <span className="block text-graphite">{step.text}</span>
              </li>
            ))}
          </ol>
          <Original source={props.source} />
        </Card>
      </SafeBlock>
    ),
    Lab: ({ props }) => (
      <SafeBlock>
        <Lab {...props} />
      </SafeBlock>
    ),
  },
})
