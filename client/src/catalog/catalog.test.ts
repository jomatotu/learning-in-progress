import { catalog, catalogForHermes, formats } from './catalog'

describe('catalog', () => {
  it.each(Object.entries(formats))(
    '%s requires a source quote',
    (_, format) => {
      // The source quote is what lets the student check every block against their own material.
      expect(format.props.shape.source.safeParse(undefined).success).toBe(false)
    },
  )

  it('catalogForHermes has the spec schema and every component with a JSON Schema for its props', () => {
    const { spec, components } = catalogForHermes()
    expect(spec).toMatchObject({ required: ['root', 'elements'] })
    expect(components.map((c) => c.name)).toEqual(
      Object.keys(catalog.data.components),
    )
    const quiz = components.find((c) => c.name === 'Quiz')
    expect(quiz?.description).toMatch(/multiple choice/i)
    expect(quiz?.props).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['question', 'source']),
    })
    expect(quiz?.props).not.toHaveProperty('$schema')
  })

  // The server sends this file to Hermes and checks replies against it. Run `npx vitest -u` after changing the catalog.
  it('matches the copy the server uses', async () => {
    await expect(
      `${JSON.stringify(catalogForHermes(), null, 2)}\n`,
    ).toMatchFileSnapshot('../../../server/app/prompts/solution_catalog.json')
  })
})
