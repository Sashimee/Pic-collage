import { Canvas } from '@react-three/fiber'
import { useGame } from '../store/gameStore'
import { isUnlocked, useSave } from '../store/saveStore'
import { BALLS, PRINCESSES, princessById } from '../data/roster'
import { useT } from '../i18n/useLang'
import { Princess } from '../three/Princess'
import { BigButton, IconButton, PickCard } from './ui'

const SKY = 'linear-gradient(180deg, #3b1e6b 0%, #7b3ba1 50%, #ffb3d9 100%)'

/**
 * The dressing room — and, for this age group, the real reason to keep playing.
 * Locked items stay visible with the star price on them: a child needs to see
 * what they are playing *for*.
 */
export function WardrobeScreen() {
  const t = useT()
  const goHome = useGame((s) => s.goHome)
  const startRound = useGame((s) => s.startRound)

  const stars = useSave((s) => s.stars)
  const princessId = useSave((s) => s.princessId)
  const ballId = useSave((s) => s.ballId)
  const setPrincess = useSave((s) => s.setPrincess)
  const setBall = useSave((s) => s.setBall)

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: SKY }}>
      <div className="flex items-center justify-between p-4">
        <IconButton label={t('wardrobe.back')} onClick={goHome}>
          ⬅️
        </IconButton>
        <span className="rounded-full bg-black/25 px-4 py-2 text-2xl font-black text-yellow-200 backdrop-blur-sm">
          ⭐ {stars}
        </span>
      </div>

      <div className="h-48 shrink-0">
        <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.4, 3.4], fov: 45 }}>
          <hemisphereLight args={['#ffe9f6', '#7a4a9a', 1.2]} />
          <directionalLight position={[3, 6, 5]} intensity={1.1} />
          <Princess data={princessById(princessId)} showcase position={[0, -0.95, 0]} />
        </Canvas>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" style={{ touchAction: 'pan-y' }}>
        <h2 className="mb-3 text-2xl font-black text-white">👑 {t('wardrobe.title')}</h2>
        <div className="mb-6 flex flex-wrap gap-3">
          {PRINCESSES.map((p) => (
            <PickCard
              key={p.id}
              badge={p.badge}
              name={p.name}
              selected={p.id === princessId}
              locked={!isUnlocked(p.unlockStars, stars)}
              lockedLabel={`⭐${p.unlockStars}`}
              onClick={() => setPrincess(p.id)}
            />
          ))}
        </div>

        <h2 className="mb-3 text-2xl font-black text-white">⚽ {t('wardrobe.balls')}</h2>
        <div className="flex flex-wrap gap-3">
          {BALLS.map((b) => (
            <PickCard
              key={b.id}
              badge={b.badge}
              selected={b.id === ballId}
              locked={!isUnlocked(b.unlockStars, stars)}
              lockedLabel={`⭐${b.unlockStars}`}
              onClick={() => setBall(b.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center p-5 pb-8">
        <BigButton onClick={startRound}>⚽ {t('wardrobe.play')}</BigButton>
      </div>
    </div>
  )
}
