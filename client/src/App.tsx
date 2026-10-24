import { ApplicationForm } from '@/components/application-form/ApplicationForm'
import { Logo } from '@/components/Logo'
import { ReadingComfort } from '@/components/ReadingComfort'

function App() {
  return (
    <>
      <header className="border-b-[1.5px] border-rule">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <h1 className="sr-only">Learning in Progress</h1>
          <Logo />
          <ReadingComfort />
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] scroll-mt-6 px-4 py-10 md:px-6 md:py-14">
        <ApplicationForm />
      </main>
    </>
  )
}

export default App
