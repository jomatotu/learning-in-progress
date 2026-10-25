import { Route, Routes } from 'react-router'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ApplicationPage } from '@/features/application/ApplicationPage'
import { Learn } from '@/features/learn/Learn'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { Playground } from '@/features/playground/Playground'
import { SolutionRoute } from '@/features/application/SolutionRoute'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/application" element={<ApplicationPage />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/learn/:id" element={<Learn />} />
          <Route path="/solution/:uuid" element={<SolutionRoute />} />
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
