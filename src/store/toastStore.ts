import { create } from 'zustand'
import { type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

/** An optional button rendered inside the toast, before the dismiss ✕. */
export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: ReactNode
  type: ToastType
  duration: number
  action?: ToastAction
}

interface ToastState {
  toasts: Toast[]
  add: (
    message: ReactNode,
    type?: ToastType,
    duration?: number,
    action?: ToastAction,
  ) => void
  remove: (id: string) => void
}

let uid = 0

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  add(message, type = 'info', duration = 3000, action) {
    const id = `toast-${++uid}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration, action }] }))
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
