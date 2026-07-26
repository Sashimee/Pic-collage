import { create } from 'zustand'
import { TRANSLATIONS } from './translations'
import type { Lang, TranslationKey } from './translations'

const KEY = 'royaume-foot:lang'

/** Browser language by prefix, English otherwise — same rule as the collage app. */
function detect(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored && stored in TRANSLATIONS) return stored as Lang
  } catch {
    // storage unavailable; fall through to detection
  }
  const candidates = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const tag of candidates) {
    const prefix = tag?.slice(0, 2).toLowerCase()
    if (prefix && prefix in TRANSLATIONS) return prefix as Lang
  }
  return 'en'
}

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangState>((set) => ({
  lang: detect(),
  setLang: (lang) => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      // preference just won't persist
    }
    document.documentElement.lang = lang
    set({ lang })
  },
}))

export function useT(): (key: TranslationKey) => string {
  const lang = useLangStore((s) => s.lang)
  return (key) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key
}
