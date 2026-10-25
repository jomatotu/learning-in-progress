import { Navigate, useLocation, useNavigate } from 'react-router'
import { Topbar } from './Topbar'
import { Home } from './Home'

// The home page: top bar and the hero screen. "Los geht's" jumps into the application flow.
// A demo link (/?demo=peter) goes straight on to the filled-in form.
export function Onboarding() {
  const navigate = useNavigate()
  const { search } = useLocation()

  if (new URLSearchParams(search).has('demo')) {
    return <Navigate replace to={`/application${search}`} />
  }

  return (
    <main className="app-shell">
      <Topbar step={0} onHome={() => navigate('/')} />
      <Home onStart={() => navigate('/application')} />
    </main>
  )
}
