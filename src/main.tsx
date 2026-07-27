import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initAnalytics } from './lib/analytics'
import './index.css'

// Outside the React tree on purpose: StrictMode double-invokes effects, and
// this must fire exactly once per page load.
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
