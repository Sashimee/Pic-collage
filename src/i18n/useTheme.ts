import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function detectTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage unavailable */
  }
  if (typeof window !== 'undefined') {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  }
  return 'dark'
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    // Dark is the default (no attribute); light opts in via [data-theme].
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }
}

const initial = detectTheme()
applyTheme(initial)

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
