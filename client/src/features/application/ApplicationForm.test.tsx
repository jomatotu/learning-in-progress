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
      'Not like me at all',
      'Not much like me',
      'Somewhat like me',
      'Quite like me',
      'Very much like me',
    ],
  },
  categories: [
    { id: 'prior_knowledge', title: 'What you already know', hint: '' },
    { id: 'working_memory', title: 'Keeping things in mind', hint: '' },
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
    await screen.findByLabelText('What should we call you?'),
    'Lina',
  )
  await user.click(screen.getByRole('button', { name: 'School' }))
  await user.click(screen.getByRole('button', { name: /continue/i }))

  await user.type(screen.getByLabelText('What are you learning?'), 'Fractions')
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

describe('ApplicationForm', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('asks for a name and a stage before leaving the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)

    await user.click(await screen.findByRole('button', { name: /continue/i }))

    expect(screen.getByText('Tell us what to call you.')).toBeInTheDocument()
    expect(screen.getByText('Pick the one that fits best.')).toBeInTheDocument()
  })

  it('counts the steps without repeating the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)
    expect(await screen.findByText('Step 1 of 5')).toBeInTheDocument()

    await user.type(screen.getByLabelText('What should we call you?'), 'Lina')
    await user.click(screen.getByRole('button', { name: 'School' }))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
  })

  it('shows the questions from the server and asks for every answer in a part', async () => {
    mockServer()
    const user = userEvent.setup()
    render(<ApplicationForm />)
    await fillAboutAndGoal(user)

    expect(screen.getByText('I know a lot.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(
      screen.getByText('Answer each one, or skip this part for now.'),
    ).toBeInTheDocument()

    for (const group of screen.getAllByRole('group')) {
      const radios = group.querySelectorAll('input[type="radio"]')
      if (radios.length) await user.click(radios[0])
    }
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(
      screen.getByRole('heading', { name: 'Keeping things in mind' }),
    ).toBeInTheDocument()
  })

  it('sends raw answers on "Build my tool" and shows the JSON the server returns', async () => {
    const fetchMock = mockServer(
      Response.json({
        learning_instructions: { prior_knowledge: ['Skip the basics.'] },
      }),
    )
    const user = userEvent.setup()
    render(<ApplicationForm />)
    await fillAboutAndGoal(user)

    // Answer "Very much like me" on the first part, skip the second.
    for (const radio of screen.getAllByRole('radio', {
      name: /very much like me/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByRole('button', { name: /skip this part/i }))
    await user.click(screen.getByRole('button', { name: 'Short videos' }))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(
      screen.getByRole('heading', { name: /does this sound like you/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 of 5 questions answered')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /build my tool/i }))

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
      await user.click(screen.getByRole('button', { name: /skip this part/i }))
    }
    await user.click(screen.getByRole('button', { name: /skip for now/i }))
    await user.click(screen.getByRole('button', { name: /build my tool/i }))

    expect(
      await screen.findByText(/couldn’t build your profile/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /does this sound like you/i }),
    ).toBeInTheDocument()
  })

  it('offers a retry when the questions can’t be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
    )
    render(<ApplicationForm />)

    expect(
      await screen.findByText(/couldn’t load the form/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument()
  })
})
