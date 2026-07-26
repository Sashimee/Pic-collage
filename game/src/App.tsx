import { useEffect } from 'react'
import { setMuted } from './audio/sfx'
import { useGame } from './store/gameStore'
import { useSave } from './store/saveStore'
import { useLangStore } from './i18n/useLang'
import { HomeScreen } from './ui/HomeScreen'
import { PlayScreen } from './ui/PlayScreen'
import { WardrobeScreen } from './ui/WardrobeScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
  const muted = useSave((s) => s.muted)
  const lang = useLangStore((s) => s.lang)

  useEffect(() => setMuted(muted), [muted])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {screen === 'home' && <HomeScreen />}
      {screen === 'wardrobe' && <WardrobeScreen />}
      {/* The result panel is an overlay, so the pitch stays visible behind it. */}
      {(screen === 'play' || screen === 'result') && <PlayScreen />}
    </div>
  )
}
