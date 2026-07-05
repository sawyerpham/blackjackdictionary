import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

export const BASE_PATH = '/blackjackdictionary'

// Redirect legacy root-level URLs (e.g. /simulator) into the namespace so old
// links keep working. Runs before the router mounts.
if (!window.location.pathname.startsWith(BASE_PATH)) {
  const { pathname, search, hash } = window.location
  window.history.replaceState(null, '', `${BASE_PATH}${pathname === '/' ? '' : pathname}${search}${hash}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE_PATH}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
