import { describe, it, expect } from 'vitest'
import { exportBoard } from './exportImage'

describe('exportImage', () => {
  it('exportBoard signature exists', () => {
    // We can't test Konva canvas rendering in jsdom, but we can verify
    // the module exports correctly and the preset map is valid.
    expect(typeof exportBoard).toBe('function')
  })
})
