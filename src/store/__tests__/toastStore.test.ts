import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '../toastStore'

beforeEach(() => {
  useToast.setState({ toasts: [] })
  vi.useRealTimers()
})

describe('toast actions', () => {
  it('keeps the action it was given', () => {
    const onClick = vi.fn()
    useToast.getState().add('Shared.', 'info', 8000, { label: 'Save', onClick })

    const [toast] = useToast.getState().toasts
    expect(toast.action?.label).toBe('Save')
    toast.action?.onClick()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('leaves the toast up after the action fires, so a mis-tap is recoverable', () => {
    useToast.getState().add('Shared.', 'info', 8000, {
      label: 'Save',
      onClick: () => {},
    })
    useToast.getState().toasts[0].action?.onClick()
    expect(useToast.getState().toasts).toHaveLength(1)
  })

  it('is optional — plain toasts carry no action', () => {
    useToast.getState().add('Saved')
    expect(useToast.getState().toasts[0].action).toBeUndefined()
  })

  it('auto-dismisses on its own timer', () => {
    vi.useFakeTimers()
    useToast.getState().add('Shared.', 'info', 8000, {
      label: 'Save',
      onClick: () => {},
    })
    expect(useToast.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(7999)
    expect(useToast.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(useToast.getState().toasts).toHaveLength(0)
  })

  it('a duration of 0 pins the toast until dismissed', () => {
    vi.useFakeTimers()
    useToast.getState().add('Pinned', 'error', 0)
    vi.advanceTimersByTime(60_000)
    expect(useToast.getState().toasts).toHaveLength(1)

    useToast.getState().remove(useToast.getState().toasts[0].id)
    expect(useToast.getState().toasts).toHaveLength(0)
  })
})
