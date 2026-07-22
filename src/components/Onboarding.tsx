import { useEffect, useState } from 'react'
import { useT } from '../i18n/useLang'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, Type, Download, X, ChevronRight } from 'lucide-react'

const ONBOARDING_KEY = 'pic-collage-onboarded-v2'

interface Step {
  id: string
  title: string
  body: string
  icon: React.ReactNode
  target?: string // CSS selector for coach mark
}

export function useOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY)
      if (!done) setShow(true)
    } catch { /* storage blocked */ }
  }, [])

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch { }
  }

  return { show, dismiss }
}

export function OnboardingOverlay() {
  const t = useT()
  const { show, dismiss } = useOnboarding()
  const [step, setStep] = useState(0)

  const steps: Step[] = [
    {
      id: 'welcome',
      title: t('onboard.welcomeTitle'),
      body: t('onboard.welcomeBody'),
      icon: <span className="text-4xl">🎨</span>,
    },
    {
      id: 'photos',
      title: t('onboard.photosTitle'),
      body: t('onboard.photosBody'),
      icon: <ImagePlus size={40} className="text-accent" />,
      target: '[data-tab="photos"]',
    },
    {
      id: 'text',
      title: t('onboard.textTitle'),
      body: t('onboard.textBody'),
      icon: <Type size={40} className="text-accent" />,
      target: '[data-tab="text"]',
    },
    {
      id: 'export',
      title: t('onboard.exportTitle'),
      body: t('onboard.exportBody'),
      icon: <Download size={40} className="text-accent" />,
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <AnimatePresence>
      {show && current && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[100] w-[min(22rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboard-title"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="mb-4">{current.icon}</div>
              <button
                onClick={dismiss}
                className="rounded-lg p-1 text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label={t('aria.skipOnboarding')}
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="onboard-title" className="text-lg font-bold text-text">{current.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{current.body}</p>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition ${
                      i === step ? 'w-5 bg-accent' : 'w-1.5 bg-surface-3'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (isLast) dismiss()
                  else setStep((s) => s + 1)
                }}
                className="bg-grad-accent flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95"
              >
                {isLast ? (t('onboard.done')) : (t('onboard.next'))}
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
