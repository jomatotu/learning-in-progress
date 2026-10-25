import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadRun } from '@/features/learn/learnStore'
import { LanguageProvider } from '@/components/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'
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
  deck: [
    {
      category: 'prior_knowledge',
      title: 'Was du schon weißt',
      low: {
        text: 'Das Thema ist neu für dich.',
        reason: 'Deshalb fangen wir vorn an.',
      },
      medium: { text: 'Du kennst schon einiges.' },
      high: {
        text: 'Du kennst dich aus.',
        reason: 'Deshalb überspringen wir Grundlagen.',
      },
    },
    {
      category: 'working_memory',
      title: 'Dinge im Kopf behalten',
      low: {
        text: 'Eine Sache pro Bildschirm.',
        reason: 'Deshalb zeigen wir eine Idee.',
      },
      medium: { text: 'Du kommst mit einer Menge klar.' },
      high: {
        text: 'Du jonglierst Ideen.',
        reason: 'Deshalb dürfen es mehrere sein.',
      },
    },
  ],
}

// The form inside the site's language setting, starting in German (the app default), with the DE | EN switch.
function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <LanguageProvider initial="de">
        <LanguageToggle />
        <ApplicationForm />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

function sse(event: string, data: unknown) {
  return new Response(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

const question = {
  done: false,
  question: 'Reading or listening?',
  options: ['Reading', 'Listening'],
  themes: [],
}
const finished = {
  done: true,
  question: '',
  options: [],
  themes: [{ theme: 'read-aloud', reason: 'You like listening.' }],
}

function urlOf(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : input.toString()
}

// Answers GET /api/survey with the survey above, POST /api/profile with `profileResponse`, and POST /api/assess
// with one question, then the picked themes. Intake requests get `intake`; the default is a failed request, so the
// deck ends after the base cards.
// What POST /api/profile returns when a test doesn't care: a complete but empty profile.
const emptyStudentProfile = {
  scale_version: 'test',
  student: { name: '', stage: '', stage_detail: '', interests: '' },
  goal: { type: '', in_their_words: '' },
  material: { topic: '', text: '', files: [] },
  learning_instructions: {},
  preferences: { likes_learning_with: [], notes: '', hard: '' },
  about_you: '',
}

function mockServer(
  profileResponse: Response = Response.json(emptyStudentProfile),
  intake: (url: string) => Promise<Response> = async () =>
    new Response(null, { status: 500 }),
) {
  let assessCalls = 0
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = urlOf(input)
    if (url.startsWith('/api/survey')) return Response.json(survey)
    if (url.startsWith('/api/intake/')) return intake(url)
    if (url === '/api/assess')
      return assessCalls++ === 0 ? sse('done', question) : sse('done', finished)
    return profileResponse
  })
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

// About, goal and notes done: the deck is next.
async function reachDeck(user: ReturnType<typeof userEvent.setup>) {
  await fillAboutAndGoal(user)
  await user.type(
    screen.getByLabelText(/Was macht Lernen gerade schwer/),
    'Lange Texte',
  )
  await user.click(screen.getByRole('button', { name: /weiter/i }))
}

describe('ApplicationForm', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('asks for a name and a stage before leaving the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()

    await user.click(await screen.findByRole('button', { name: /weiter/i }))

    expect(
      screen.getByText('Sag uns, wie wir dich nennen sollen.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Wähl das, was am besten passt.'),
    ).toBeInTheDocument()
  })

  it('counts the steps without repeating the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    expect(await screen.findByText('Schritt 1 von 5')).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('Wie sollen wir dich nennen?'),
      'Lina',
    )
    await user.click(screen.getByRole('button', { name: 'Schule' }))
    await user.click(screen.getByRole('button', { name: /weiter/i }))

    expect(screen.getByText('Schritt 2 von 5')).toBeInTheDocument()
  })

  it('shows the survey questions after "Genauer?" on the last deck card and asks for every answer in a part', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)

    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(
      screen.getByRole('button', { name: 'Genauer? 30 kurze Fragen' }),
    )
    expect(screen.getByText('I know a lot.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /weiter/i }))
    expect(
      screen.getByText(
        'Beantworte jede Aussage oder überspring diesen Teil erst mal.',
      ),
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

  it('sends deck bands and raw answers on "Meine Lösung bauen", asks the questions, and opens the pages', async () => {
    const studentProfile = {
      scale_version: 'test',
      student: {
        name: 'Lina',
        stage: 'School',
        stage_detail: '',
        interests: '',
      },
      goal: { type: '', in_their_words: '' },
      material: {
        topic: 'Fractions',
        text: 'Halves and quarters.',
        files: [],
      },
      learning_instructions: { prior_knowledge: ['Skip the basics.'] },
      preferences: { likes_learning_with: [], notes: '' },
    }
    const fetchMock = mockServer(Response.json(studentProfile))
    const openMock = vi.fn<typeof window.open>()
    vi.stubGlobal('open', openMock)
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)

    // Deck: "Stimmt" on the first card, then the 30 questions from the last card.
    await user.click(screen.getByRole('button', { name: /stimmt/i }))
    await user.click(
      screen.getByRole('button', { name: 'Genauer? 30 kurze Fragen' }),
    )
    for (const radio of screen.getAllByRole('radio', {
      name: /stimmt total/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    await user.click(screen.getByRole('button', { name: /überspringen/i }))

    expect(
      screen.getByRole('heading', { name: /klingt das nach dir/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 von 5 Fragen beantwortet')).toBeInTheDocument()
    expect(
      screen.queryByText('Das Thema ist neu für dich.'),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /\(DevMode\) Mein Werzeug bauen\./i }),
    )

    // The client sends the raw answers only; scoring is the server's job.
    const bodyOf = (path: string) => {
      const call = fetchMock.mock.calls.find(([input]) => urlOf(input) === path)
      const sent = call?.[1]?.body
      return JSON.parse(typeof sent === 'string' ? sent : '{}')
    }
    const body = bodyOf('/api/profile')
    expect(body.answers).toEqual({ pk1: 5, pk2: 5, pk3: 5 })
    expect(body.bands).toEqual({ prior_knowledge: 'low' })
    expect(body.preferences.hard).toBe('Lange Texte')
    expect(body.material.topic).toBe('Fractions')

    expect(
      await screen.findByRole('heading', { name: /danke, lina/i }),
    ).toBeInTheDocument()
    // The profile JSON is for the team: only with ?debug (see AssessmentScreen.test.tsx).
    expect(screen.queryByText(/"Skip the basics\."/)).not.toBeInTheDocument()

    // Hermes gets the profile without the pasted text.
    const hermesProfile = {
      ...studentProfile,
      material: { topic: 'Fractions', files: [] },
    }
    expect(bodyOf('/api/assess')).toEqual({
      profile: hermesProfile,
      answers: [],
      material: 'Fractions\n\nHalves and quarters.',
      student_id: expect.any(String),
    })

    await user.click(await screen.findByRole('button', { name: 'Listening' }))
    expect(await screen.findByText(/You like listening/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^erstellen$/i }))

    const [url, target] = openMock.mock.calls[0]
    expect(target).toBe('_blank')
    expect(loadRun(String(url).replace('/learn/', ''))).toEqual({
      profile: hermesProfile,
      answers: [{ question: 'Reading or listening?', answer: 'Listening' }],
      material: 'Fractions\n\nHalves and quarters.',
      themes: finished.themes,
    })
  })

  it('opens the Magic page instead when the student picks it', async () => {
    mockServer(Response.json({ learning_instructions: {} }))
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: /^Mein Werkzeug bauen$/ }))

    expect(
      await screen.findByRole('heading', { name: /magische lösung/i }),
    ).toBeInTheDocument()
  })

  it('shows deck text only for categories without survey answers', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Stimmt' }))
    await user.click(screen.getByRole('button', { name: 'Stimmt' }))
    await user.click(
      screen.getByRole('button', { name: 'Genauer? 30 kurze Fragen' }),
    )
    for (const radio of screen.getAllByRole('radio', {
      name: /stimmt total/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    await user.click(screen.getByRole('button', { name: /überspringen/i }))

    expect(
      screen.queryByText('Das Thema ist neu für dich.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Eine Sache pro Bildschirm.')).toBeInTheDocument()
  })

  it('returns to the review after editing "Über dich" and keeps the deck bands', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Stimmt' }))
    await user.click(screen.getByRole('button', { name: 'Stimmt' }))

    await user.click(screen.getAllByRole('button', { name: 'Ändern' })[0])
    await user.click(screen.getByRole('button', { name: /weiter/i }))

    expect(
      screen.getByRole('heading', { name: /klingt das nach dir/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Das Thema ist neu für dich.')).toBeInTheDocument()
    expect(screen.getByText('Eine Sache pro Bildschirm.')).toBeInTheDocument()
  })

  it('restarts the deck from "Ändern" on "Wie du lernst"', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))

    const edits = screen.getAllByRole('button', { name: 'Ändern' })
    await user.click(edits[3])

    expect(screen.getByText(/Karte 1 von/)).toBeInTheDocument()
  })

  it('reaches the review and builds when every deck card is skipped', async () => {
    const fetchMock = mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)

    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))

    expect(screen.getByText('Übersprungen')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /\(DevMode\) Mein Werzeug bauen\./i }),
    )
    const profileCall = fetchMock.mock.calls.find(
      ([input]) => urlOf(input) === '/api/profile',
    )
    const sent = profileCall?.[1]?.body
    expect(JSON.parse(typeof sent === 'string' ? sent : '{}').bands).toEqual({})
  })

  it('shows the medium text on the review for a medium band', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)

    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))
    await user.click(screen.getByRole('button', { name: 'Eher nicht' }))

    expect(
      screen.getByText('Du kommst mit einer Menge klar.'),
    ).toBeInTheDocument()
  })

  it('goes back from the review to the deck when no survey was answered', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))

    await user.click(screen.getByRole('button', { name: 'Zurück' }))

    expect(screen.getByText('Das Thema ist neu für dich.')).toBeInTheDocument()
    expect(screen.getByText('Karte 1 von etwa 5')).toBeInTheDocument()
  })

  it('goes back from the review to the last survey part when survey answers exist', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(
      screen.getByRole('button', { name: 'Genauer? 30 kurze Fragen' }),
    )
    for (const radio of screen.getAllByRole('radio', {
      name: /stimmt total/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /weiter/i }))
    await user.click(screen.getByRole('button', { name: /überspringen/i }))

    await user.click(screen.getByRole('button', { name: 'Zurück' }))

    expect(
      screen.getByRole('heading', { name: 'Dinge im Kopf behalten' }),
    ).toBeInTheDocument()
  })

  it('stays on the review with a message when the server can’t build the profile', async () => {
    mockServer(new Response(null, { status: 500 }))
    const user = userEvent.setup()
    renderForm()
    await reachDeck(user)
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
    await user.click(
      screen.getByRole('button', { name: /\(DevMode\) Mein Werzeug bauen\./i }),
    )

    expect(
      await screen.findByText(/konnten dein profil nicht erstellen/i),
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
    renderForm()

    expect(
      await screen.findByText(/konnten das formular nicht laden/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /nochmal versuchen/i }),
    ).toBeInTheDocument()
  })

  describe('Hermes cards', () => {
    const cards = [
      { id: 'c1', text: 'Hermes eins', yes: 'c2', no: null },
      { id: 'c2', text: 'Hermes zwei', yes: null, no: null },
    ]
    const intakeCalls = (fetchMock: ReturnType<typeof mockServer>) =>
      fetchMock.mock.calls.filter(([input]) =>
        urlOf(input).startsWith('/api/intake/'),
      )
    const bodyOf = (call: Parameters<typeof fetch>) =>
      JSON.parse(typeof call[1]?.body === 'string' ? call[1].body : '{}')

    it('requests the cards once when leaving the notes, not again on Zurück and forward', async () => {
      const fetchMock = mockServer(
        Response.json(emptyStudentProfile),
        async () => Response.json({ token: 't', cards }),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(screen.getByRole('button', { name: 'Zurück' }))
      await user.click(screen.getByRole('button', { name: /weiter/i }))

      const calls = intakeCalls(fetchMock)
      expect(calls).toHaveLength(1)
      expect(urlOf(calls[0][0])).toBe('/api/intake/cards')
      const body = bodyOf(calls[0])
      expect(body.student.name).toBe('Lina')
      expect(body.topic).toBe('Fractions')
      expect(body.preferences.hard).toBe('Lange Texte')
    })

    it('runs through Hermes cards and the summary into the review and the profile', async () => {
      const fetchMock = mockServer(
        Response.json(emptyStudentProfile),
        async (url) =>
          url.endsWith('/cards')
            ? Response.json({ token: 't', cards })
            : Response.json({ about_you: 'Du magst Fußball.' }),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(await screen.findByRole('button', { name: /stimmt/i }))
      await user.click(screen.getByRole('button', { name: /stimmt/i }))
      // Hermes cards arrived while the student answered.
      expect(await screen.findByText('Hermes eins')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /stimmt/i }))
      await user.click(screen.getByRole('button', { name: /stimmt/i }))

      const area = await screen.findByLabelText('Das habe ich verstanden')
      expect(area).toHaveValue('Du magst Fußball.')
      await user.type(area, ' Und Musik.')
      await user.click(screen.getByRole('button', { name: /stimmt so/i }))

      expect(screen.getByText('Du magst Fußball. Und Musik.')).toBeVisible()
      const summaryCall = intakeCalls(fetchMock)[1]
      expect(bodyOf(summaryCall)).toEqual({
        token: 't',
        student_id: expect.any(String),
        bands: { prior_knowledge: 'low', working_memory: 'low' },
        card_answers: [
          { id: 'c1', answer: 'stimmt' },
          { id: 'c2', answer: 'stimmt' },
        ],
      })

      await user.click(
        screen.getByRole('button', { name: /\(DevMode\) Mein Werzeug bauen\./i }),
      )
      const profileCall = fetchMock.mock.calls.find(
        ([input]) => urlOf(input) === '/api/profile',
      )!
      expect(bodyOf(profileCall).about_you).toBe('Du magst Fußball. Und Musik.')
    })

    it('still ends the deck and reaches the review when the card request never resolves', async () => {
      mockServer(
        Response.json(emptyStudentProfile),
        () => new Promise<Response>(() => {}),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      expect(
        screen.getByRole('heading', { name: /klingt das nach dir/i }),
      ).toBeInTheDocument()
      expect(screen.queryByText('Das habe ich verstanden')).toBeNull()
    })

    it('Zurück from the review goes to the summary when Hermes cards exist', async () => {
      mockServer(Response.json(emptyStudentProfile), async (url) =>
        url.endsWith('/cards')
          ? Response.json({ token: 't', cards: [cards[1]] })
          : Response.json({ about_you: null }),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(await screen.findByRole('button', { name: /stimmt/i }))
      await user.click(screen.getByRole('button', { name: /stimmt/i }))
      await user.click(await screen.findByRole('button', { name: /stimmt/i }))
      await user.click(await screen.findByRole('button', { name: /weiter/i }))
      await user.click(screen.getByRole('button', { name: 'Zurück' }))
      expect(
        screen.getByText('Hat diesmal nicht geklappt – kein Problem.'),
      ).toBeInTheDocument()
    })

    it('keeps the token when Hermes returns no cards, so the summary still runs', async () => {
      mockServer(Response.json(emptyStudentProfile), async (url) =>
        url.endsWith('/cards')
          ? Response.json({ token: 't', cards: [] })
          : Response.json({ about_you: 'Du magst Fußball.' }),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(
        await screen.findByRole('button', { name: 'Weiß nicht' }),
      )
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      expect(
        await screen.findByLabelText('Das habe ich verstanden'),
      ).toHaveValue('Du magst Fußball.')
    })

    it('asks again and clears the confirmed text when the answers changed after the summary', async () => {
      let summaries = 0
      const fetchMock = mockServer(
        Response.json(emptyStudentProfile),
        async (url) =>
          url.endsWith('/cards')
            ? Response.json({ token: 't', cards: [cards[1]] })
            : Response.json({ about_you: `Text ${++summaries}` }),
      )
      const user = userEvent.setup()
      renderForm()
      await reachDeck(user)
      await user.click(await screen.findByRole('button', { name: /stimmt/i }))
      await user.click(screen.getByRole('button', { name: /stimmt/i }))
      await user.click(await screen.findByRole('button', { name: /stimmt/i }))
      await user.click(
        await screen.findByRole('button', { name: /stimmt so/i }),
      )
      expect(screen.getByText('Text 1')).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Zurück' }))
      await user.click(screen.getByRole('button', { name: 'Zurück' }))
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))
      await user.click(screen.getByRole('button', { name: 'Weiß nicht' }))

      expect(
        await screen.findByLabelText('Das habe ich verstanden'),
      ).toHaveValue('Text 2')
      expect(intakeCalls(fetchMock)).toHaveLength(3)
    })
  })

  it('switches the texts to English without leaving the current step', async () => {
    const fetchMock = mockServer()
    const user = userEvent.setup()
    renderForm()
    await fillAboutAndGoal(user)
    expect(
      screen.getByLabelText(/Was macht Lernen gerade schwer/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Englisch' }))

    expect(
      await screen.findByLabelText(/What makes learning hard right now/),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([input]) => urlOf(input) === '/api/survey?lang=en',
      ),
    ).toBe(true)
    expect(localStorage.getItem('language')).toBe('en')
  })
})
