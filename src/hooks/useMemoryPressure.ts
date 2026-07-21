import { useEffect } from 'react'
import { useToasts } from '../components/ToastContainer'

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

declare global {
  interface Performance {
    memory?: MemoryInfo
  }
}

const INTERVAL_MS = 30_000
const THRESHOLD = 0.8

export function useMemoryPressure() {
  const toast = useToasts()

  useEffect(() => {
    if (!performance.memory) return

    const check = () => {
      const mem = performance.memory!
      const ratio = mem.usedJSHeapSize / mem.jsHeapSizeLimit
      if (ratio > THRESHOLD) {
        toast.warn(
          `Memory is running low — consider saving and reloading. (${(ratio * 100).toFixed(0)}% used)`,
        )
      }
    }

    check()
    const id = setInterval(check, INTERVAL_MS)
    return () => clearInterval(id)
  }, [toast])
}
