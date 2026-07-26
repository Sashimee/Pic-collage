import { Canvas } from '@react-three/fiber'
import { useGame } from '../store/gameStore'
import { useSave } from '../store/saveStore'
import { princessById } from '../data/roster'
import { useT, useLangStore } from '../i18n/useLang'
import { LANGS } from '../i18n/translations'
import { Princess } from '../three/Princess'
import { BigButton, IconButton } from './ui'

const SKY = 'linear-gradient(180deg, #4a1e6b 0%, #a13b91 45%, #ff9ec4 100%)'

export function HomeScreen() {
  const t = useT()
  const startRound = useGame((s) => s.startRound)
  const goWardrobe = useGame((s) => s.goWardrobe)
  const princess = useSave((s) => princessById(s.princessId))
  const stars = useSave((s) => s.stars)
  const muted = useSave((s) => s.muted)
  const toggleMute = useSave((s) => s.toggleMute)

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: SKY }}>
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 backdrop-blur-sm">
          <span className="text-2xl font-black text-yellow-200">⭐ {stars}</span>
        </div>
        <div className="flex gap-2">
          <IconButton label={muted ? t('sound.off') : t('sound.on')} onClick={toggleMute}>
            {muted ? '🔇' : '🔊'}
          </IconButton>
        </div>
      </div>

      <h1 className="animate-wobble text-balance px-6 text-center text-4xl font-black tracking-tight text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.3)]">
        👑 {t('app.title')} ⚽
      </h1>

      {/* The chosen princess, waving from the menu. */}
      <div className="min-h-0 flex-1">
        <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.5, 3.6], fov: 45 }}>
          <hemisphereLight args={['#ffe9f6', '#7a4a9a', 1.2]} />
          <directionalLight position={[3, 6, 5]} intensity={1.1} />
          <Princess data={princess} showcase position={[0, -0.9, 0]} />
        </Canvas>
      </div>

      <div className="flex flex-col items-center gap-3 p-6 pb-10">
        <BigButton onClick={startRound}>⚽ {t('home.play')}</BigButton>
        <BigButton tone="secondary" onClick={goWardrobe}>
          👗 {t('home.wardrobe')}
        </BigButton>
        <LangRow />
      </div>
    </div>
  )
}

function LangRow() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)

  return (
    <div className="mt-2 flex gap-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-label={l.label}
          aria-pressed={l.code === lang}
          onClick={() => setLang(l.code)}
          className={`h-14 w-14 rounded-xl text-2xl transition ${
            l.code === lang ? 'scale-110 bg-white/25' : 'opacity-60'
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}
