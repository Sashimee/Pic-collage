import { useEffect } from 'react'

/** Cross-tab sync via BroadcastChannel */
const CHANNEL_NAME = 'pic-collage-sync'

export function useCrossTabSync(callback: (data: any) => void) {
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e) => callback(e.data)

    return () => channel.close()
  }, [callback])
}

export function broadcastTab(data: any) {
  if (!('BroadcastChannel' in window)) return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage(data)
  channel.close()
}
