import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { StudentProfile } from '@/api/profile'
import { LanguageProvider } from '@/components/LanguageProvider'
import { AssessmentScreen } from './AssessmentScreen'

const research = {
  summary:
    'Short steps help you most. Long texts tire you out, so we split them up.',
  findings: [
    {
      need: 'focus',
      strategy: 'Work in 10-minute blocks. Then take a short break.',
      how_to_apply: 'Set a timer and stop when it rings.',
      source_title: 'ADHD study',
      source_url: 'https://example.org/adhd',
    },
    {
      need: 'reading',
      strategy: 'Listen to the text. Read along if you like.',
      how_to_apply: 'Use the read-aloud button on each page.',
      source_title: 'Dyslexia study',
      source_url: 'https://example.org/dyslexia',
    },
  ],
}

const profile: StudentProfile = {
  scale_version: 'test',
  student: { name: 'Mia', stage: '', stage_detail: '', interests: '' },
  goal: { type: '', in_their_words: '' },
  material: { topic: '', text: '', files: [] },
  learning_instructions: {},
  preferences: { likes_learning_with: [], notes: '', hard: '' },
  about_you: '',
}

function sse(event: string, data: unknown) {
  return new Response(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function renderScreen() {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input) => {
      const url = input instanceof Request ? input.url : input.toString()
      if (url === '/api/research') return sse('done', research)
      return sse('done', {
        done: false,
        question: 'Reading or listening?',
        options: ['Reading', 'Listening'],
        themes: [],
      })
    }),
  )
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <LanguageProvider initial="de">
        <AssessmentScreen
          name="Mia"
          studentProfile={profile}
          onBack={() => {}}
        />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

describe('AssessmentScreen research results', () => {
  it('shows the first sentences only and folds the rest behind "Mehr zeigen"', async () => {
    renderScreen()

    expect(await screen.findByText('Short steps help you most.')).toBeVisible()
    expect(screen.getByText('Work in 10-minute blocks.')).toBeVisible()
    expect(screen.getByText('Listen to the text.')).toBeVisible()
    expect(
      screen.getByText('Set a timer and stop when it rings.'),
    ).not.toBeVisible()
    expect(screen.getByRole('link', { name: /ADHD study/ })).not.toBeVisible()

    await userEvent.setup().click(screen.getByText('Mehr zeigen'))

    expect(
      screen.getByText('Set a timer and stop when it rings.'),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: /ADHD study/ })).toHaveAttribute(
      'href',
      'https://example.org/adhd',
    )
    expect(screen.getByRole('link', { name: /ADHD study/ })).toBeVisible()
  })

  it('hides the profile JSON unless the URL has ?debug', async () => {
    renderScreen()
    await screen.findByText('Short steps help you most.')
    expect(
      screen.queryByText('Dein Profil als JSON ansehen'),
    ).not.toBeInTheDocument()
  })

  it('shows the profile JSON with ?debug', async () => {
    window.history.replaceState({}, '', '/application?debug')
    renderScreen()
    expect(
      await screen.findByText('Dein Profil als JSON ansehen'),
    ).toBeInTheDocument()
  })
})
