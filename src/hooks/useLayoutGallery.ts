import { useState, useEffect, useCallback } from 'react'

const RECENT_KEY = 'pic-collage-recent-layouts-v1'
const FAV_KEY = 'pic-collage-favorite-layouts-v1'
const MAX_RECENT = 12

function loadArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveArray(key: string, arr: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr))
  } catch {
    /* ignore */
  }
}

export function useRecentLayouts() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setRecent(loadArray(RECENT_KEY))
  }, [])

  const addRecent = useCallback((layoutId: string) => {
    setRecent((prev) => {
      const next = [layoutId, ...prev.filter((id) => id !== layoutId)].slice(
        0,
        MAX_RECENT,
      )
      saveArray(RECENT_KEY, next)
      return next
    })
  }, [])

  return { recent, addRecent }
}

export function useFavoriteLayouts() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    setFavorites(loadArray(FAV_KEY))
  }, [])

  const toggleFavorite = useCallback((layoutId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(layoutId)
      const next = exists
        ? prev.filter((id) => id !== layoutId)
        : [layoutId, ...prev]
      saveArray(FAV_KEY, next)
      return next
    })
  }, [])

  return { favorites, toggleFavorite }
}
