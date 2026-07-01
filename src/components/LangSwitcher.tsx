import { useLang } from '../i18n/useLang'
import { LANGS } from '../i18n/translations'

// Two flag buttons in the header; highlights the active language.
export function LangSwitcher() {
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-slate-800 p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-label={l.label}
          title={l.label}
          className={`rounded-md px-1.5 py-1 text-base leading-none transition ${
            lang === l.id ? 'bg-slate-600' : 'opacity-50 hover:opacity-100'
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}
