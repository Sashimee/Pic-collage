import { create } from 'zustand'
import { type Lang, translations } from './translations'

const STORAGE_KEY = 'lang'

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'de' || saved === 'en') return saved
  } catch {
    /* localStorage unavailable */
  }
  const prefs =
    typeof navigator !== 'undefined'
      ? navigator.languages ?? [navigator.language]
      : []
  return prefs.some((l) => l?.toLowerCase().startsWith('de')) ? 'de' : 'en'
}

function applyDocumentLang(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

const initial = detectLang()
applyDocumentLang(initial)

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLang = create<LangState>((set) => ({
  lang: initial,
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
    applyDocumentLang(lang)
    set({ lang })
  },
}))

export type TFunc = (key: string) => string

// Hook returning a translator bound to the current language. English is the
// fallback; an unknown key returns the key itself so misses are visible.
export function useT(): TFunc {
  const lang = useLang((s) => s.lang)
  return (key: string) =>
    translations[lang][key] ?? translations.en[key] ?? key
}
