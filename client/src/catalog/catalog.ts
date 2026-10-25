// The formats Hermes may build a lesson from. Single source of truth for the renderer
// and for the catalog the server sends to Hermes.
import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'

const source = z
  .string()
  .describe(
    'The exact sentence(s) from the student material this block is based on, copied word for word.',
  )

// Every format carries `source`, so the student can always check a block against the original.
export const formats = {
  Chunk: {
    props: z.object({ heading: z.string(), text: z.string(), source }),
    description:
      'One short, self-contained piece of the material: a clear heading and at most 3 short sentences. Use many Chunks instead of one long text.',
  },
  Flashcard: {
    props: z.object({ front: z.string(), back: z.string(), source }),
    description:
      'A term or question on the front, the answer on the back. For retrieval practice of facts and vocabulary.',
  },
  Quiz: {
    props: z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(4),
      answer: z
        .number()
        .int()
        .describe('Index of the correct option, starting at 0.'),
      explanation: z.string(),
      source,
    }),
    description:
      'A multiple choice question with immediate feedback. Checks understanding right after a few Chunks.',
  },
  ReadAloud: {
    props: z.object({ text: z.string(), source }),
    description:
      'Text the student can listen to with one tap (browser speech). For students who struggle with reading.',
  },
  Steps: {
    props: z.object({
      title: z.string(),
      steps: z.array(z.object({ label: z.string(), text: z.string() })).min(2),
      source,
    }),
    description:
      'An ordered process or sequence, one short step at a time. For anything that happens in order.',
  },
}

export const catalog = defineCatalog(schema, {
  components: {
    Lesson: {
      props: z.object({ title: z.string() }),
      description:
        'The root of every page. Its children are the blocks in reading order. Use it exactly once.',
    },
    ...formats,
  },
  actions: {},
})

// What the server sends to Hermes and checks replies against (as server/app/prompts/solution_catalog.json):
// the spec shape, plus every component's description and props as JSON Schema.
export function catalogForHermes() {
  const components = Object.entries(catalog.data.components).map(
    ([name, c]) => {
      const { $schema: _, ...props } = z.toJSONSchema(c.props)
      return { name, description: c.description, props }
    },
  )
  return { spec: catalog.jsonSchema(), components }
}
