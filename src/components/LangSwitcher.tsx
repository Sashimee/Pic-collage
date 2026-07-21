import { useLang } from '../i18n/useLang'
import { LANGS } from '../i18n/translations'

// Two flag buttons in the header; highlights the active language.
export function LangSwitcher() {
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-label={l.label}
          title={l.label}
          className={`rounded-md px-1.5 py-1 text-base leading-none transition ${
            lang === l.id ? 'bg-surface-3' : 'opacity-50 hover:opacity-100'
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}

// Compact single-button toggle for mobile where space is tight.
export function LangSwitcherMobile() {
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)
  const next = lang === 'de' ? 'en' : 'de'
  const label = next === 'en' ? 'English' : 'Deutsch'
  const flag = next === 'en' ? '🇬🇧' : '🇩🇪'

  return (
    <button
      onClick={() => setLang(next)}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-lg transition hover:bg-surface-3"
    >
      {flag}
    </button>
  )
}
