import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToast } from '../store/toastStore'
import type { ReactNode } from 'react'
import { useT } from '../i18n/useLang'

const ICONS: Record<string, ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-400" />,
  error: <AlertCircle size={18} className="text-danger" />,
  info: <Info size={18} className="text-accent" />,
}

export function ToastContainer() {
  const t = useT()
  const toasts = useToast((s) => s.toasts)
  const remove = useToast((s) => s.remove)

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[100] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="pointer-events-auto flex min-w-[12rem] max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface/95 px-4 py-2.5 text-sm font-medium text-text shadow-[var(--shadow-card)] backdrop-blur"
          >
            {ICONS[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => remove(toast.id)}
              className="ml-1 rounded-md p-1 text-muted transition hover:text-text hover:bg-surface-2"
              aria-label={t('aria.dismiss')}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Convenience hook for firing toasts from components. */
export function useToasts() {
  const addToast = useToast((s) => s.add)
  return {
    success: (msg: string) => addToast(msg, 'success', 3000),
    error: (msg: string) => addToast(msg, 'error', 4000),
    info: (msg: string) => addToast(msg, 'info', 3000),
    warn: (msg: string) => addToast(msg, 'error', 5000),
  }
}
