import { create } from 'zustand'
import { type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: ReactNode
  type: ToastType
  duration: number
}

interface ToastState {
  toasts: Toast[]
  add: (message: ReactNode, type?: ToastType, duration?: number) => void
  remove: (id: string) => void
}

let uid = 0

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  add(message, type = 'info', duration = 3000) {
    const id = `toast-${++uid}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
