import { Route, Routes } from 'react-router'
import { ApplicationPage } from '@/features/application/ApplicationPage'
import { Learn } from '@/features/learn/Learn'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { Playground } from '@/features/playground/Playground'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/application" element={<ApplicationPage />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="/learn/:id" element={<Learn />} />
    </Routes>
  )
}

export default App
