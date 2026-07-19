import { Component, type ReactNode } from 'react'
import { useT } from '../i18n/useLang'
import { PrimaryButton } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    try {
      const req = indexedDB.deleteDatabase('piccollage')
      req.onsuccess = () => window.location.reload()
      req.onerror = () => window.location.reload()
      setTimeout(() => window.location.reload(), 300)
    } catch {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReload={this.handleReload}
          onReset={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}

function ErrorFallback({
  error,
  onReload,
  onReset,
}: {
  error?: Error
  onReload: () => void
  onReset: () => void
}) {
  const t = useT()
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <h2 className="text-xl font-bold text-text">{t('error.title')}</h2>
      <p className="max-w-md text-sm text-muted">{t('error.message')}</p>
      {error && (
        <pre className="max-w-md overflow-auto rounded-lg bg-surface-2 p-3 text-xs text-text/70">
          {error.message}
        </pre>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <PrimaryButton onClick={onReload}>{t('error.reload')}</PrimaryButton>
        <PrimaryButton onClick={onReset}>{t('error.reset')}</PrimaryButton>
      </div>
    </div>
  )
}
