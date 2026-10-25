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
  Lab: {
    props: z.object({
      title: z.string(),
      sliders: z
        .array(
          z.object({
            key: z.string().describe('Short unique id, e.g. "licht".'),
            label: z.string().describe('e.g. "Lichtstärke".'),
            unit: z.string().describe('e.g. "%" or "ppm".'),
            min: z.number(),
            max: z.number(),
            step: z.number(),
            value: z.number().describe('Start value.'),
            effect: z
              .enum(['saturating', 'linear', 'optimum'])
              .describe(
                'How this factor drives the output. saturating: rises, then levels off (e.g. light, CO2). linear: rises steadily. optimum: best at k, worse on both sides (e.g. temperature).',
              ),
            k: z
              .number()
              .optional()
              .describe(
                'saturating: the value where the effect has done about half its rise. optimum: the best value.',
              ),
            width: z
              .number()
              .optional()
              .describe(
                'optimum only: how far from k the effect drops to about a third.',
              ),
          }),
        )
        .min(1)
        .max(3)
        .describe(
          "The factors. The first slider is the chart's x-axis; the output is max times the effects of all sliders multiplied.",
        ),
      output: z.object({
        label: z.string().describe('e.g. "Fotosyntheserate".'),
        unit: z.string(),
        max: z
          .number()
          .describe('The output when every effect is at its best.'),
      }),
      notes: z
        .array(
          z.object({
            upTo: z
              .number()
              .describe(
                'Shown while the first slider is at or below this value.',
              ),
            text: z
              .string()
              .describe(
                'One short sentence, e.g. "Bei wenig Licht fehlt der Pflanze Energie."',
              ),
          }),
        )
        .min(2)
        .describe('Sorted by upTo; the last one covers the rest of the range.'),
      source,
    }),
    description:
      'An interactive experiment: the student moves 1 to 3 sliders (the factors) and a live chart shows how the output changes. Use it for science topics where factors change a rate or amount (e.g. photosynthesis: light, CO2, temperature). Only model relationships the material states or clearly implies.',
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
