import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Survey } from '@/lib/survey'
import { ApplicationForm } from './ApplicationForm'

// A small stand-in for GET /api/survey: two categories, five questions.
const survey: Survey = {
  version: 'test',
  response_scale: {
    min: 1,
    max: 5,
    labels: [
      'Stimmt gar nicht',
      'Stimmt eher nicht',
      'Stimmt ein bisschen',
      'Stimmt ziemlich',
      'Stimmt total',
    ],
  },
  categories: [
    { id: 'prior_knowledge', title: 'Was du schon weißt', hint: '' },
    { id: 'working_memory', title: 'Dinge im Kopf behalten', hint: '' },
  ],
  questions: [
    {
      id: 'pk1',
      category: 'prior_knowledge',
      text: 'I know a lot.',
      priority: 'high',
    },
    {
      id: 'pk2',
      category: 'prior_knowledge',
      text: 'I could explain it.',
      priority: 'low',
    },
    {
      id: 'pk3',
      category: 'prior_knowledge',
      text: 'It is all new.',
      priority: 'high',
    },
    {
      id: 'wm1',
      category: 'working_memory',
      text: 'I forget steps.',
      priority: 'high',
    },
    {
      id: 'wm2',
      category: 'working_memory',
      text: 'I lose track.',
      priority: 'low',
    },
  ],
}

function urlOf(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : input.toString()
}

// Answers GET /api/survey with the survey above and POST /api/profile with `profileResponse`.
function mockServer(profileResponse: Response = Response.json({})) {
  const fetchMock = vi.fn<typeof fetch>(async (input) =>
    urlOf(input) === '/api/survey' ? Response.json(survey) : profileResponse,
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function fillAboutAndGoal(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByLabelText('Wie sollen wir dich nennen?'),
    'Lina',
  )
  await user.click(screen.getByRole('button', { name: 'Schule' }))
  await user.click(screen.getByRole('button', { name: /weiter/i }))

  await user.type(screen.getByLabelText('Was lernst du gerade?'), 'Fractions')
  await user.click(screen.getByRole('button', { name: /weiter/i }))
}

describe('ApplicationForm', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('asks for a name and a stage before leaving the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)

    await user.click(await screen.findByRole('button', { name: /weiter/i }))

    expect(
      screen.getByText('Sag uns, wie wir dich nennen sollen.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Wähl aus, was am besten passt.'),
    ).toBeInTheDocument()
  })

  it('counts the steps without repeating the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)
    expect(await screen.findByText('Schritt 1 von 5')).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('Wie sollen wir dich nennen?'),
      'Lina',
    )
    await user.click(screen.getByRole('button', { name: 'Schule' }))
    await user.click(screen.getByRole('button', { name: /weiter/i }))

    expect(screen.getByText('Schritt 2 von 5')).toBeInTheDocument()
  })

  it('shows the questions from the server and asks for every answer in a part', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)
    await fillAboutAndGoal(user)

    expect(screen.getByText('I know a lot.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /weiter/i }))
    expect(
      screen.getByText('Beantworte jede Aussage oder überspring diesen Teil.'),
    ).toBeInTheDocument()

    for (const group of screen.getAllByRole('group')) {
      const radios = group.querySelectorAll('input[type="radio"]')
      if (radios.length) await user.click(radios[0])
    }
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    expect(
      screen.getByRole('heading', { name: 'Dinge im Kopf behalten' }),
    ).toBeInTheDocument()
  })

  it('sends raw answers on "Meine Lösung bauen" and shows the JSON the server returns', async () => {
    const fetchMock = mockServer(
      Response.json({
        learning_instructions: { prior_knowledge: ['Skip the basics.'] },
      }),
    )
    const user = userEvent.setup()
    render(<ApplicationForm />)
    await fillAboutAndGoal(user)

    // Answer "Stimmt total" on the first part, skip the second.
    for (const radio of screen.getAllByRole('radio', {
      name: /stimmt total/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    await user.click(screen.getByRole('button', { name: /überspringen/i }))
    await user.click(screen.getByRole('button', { name: 'Kurze Videos' }))
    await user.click(screen.getByRole('button', { name: /weiter/i }))

    expect(
      screen.getByRole('heading', { name: /klingt das nach dir/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 von 5 Fragen beantwortet')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /meine lösung bauen/i }),
    )

    // The client sends the raw answers only; scoring is the server's job.
    const profileCall = fetchMock.mock.calls.find(
      ([input]) => urlOf(input) === '/api/profile',
    )
    const sent = profileCall?.[1]?.body
    const body = JSON.parse(typeof sent === 'string' ? sent : '{}')
    expect(body.answers).toEqual({ pk1: 5, pk2: 5, pk3: 5 })
    expect(body.material.topic).toBe('Fractions')

    expect(
      await screen.findByRole('heading', { name: /magische lösung/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /lösung öffnen/i }),
    ).toBeInTheDocument()
  })

  it('stays on the review with a message when the server can’t build the profile', async () => {
    mockServer(new Response(null, { status: 500 }))
    const user = userEvent.setup()
    render(<ApplicationForm />)
    await fillAboutAndGoal(user)
    for (let i = 0; i < survey.categories.length; i++) {
      await user.click(screen.getByRole('button', { name: /überspringen/i }))
    }
    await user.click(screen.getByRole('button', { name: /überspringen/i }))
    await user.click(
      screen.getByRole('button', { name: /meine lösung bauen/i }),
    )

    expect(
      await screen.findByText(/konnten dein profil nicht bauen/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /klingt das nach dir/i }),
    ).toBeInTheDocument()
  })

  it('offers a retry when the questions can’t be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
    )
    render(<ApplicationForm />)

    expect(
      await screen.findByText(/konnten das formular nicht laden/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /nochmal versuchen/i }),
    ).toBeInTheDocument()
  })
})
