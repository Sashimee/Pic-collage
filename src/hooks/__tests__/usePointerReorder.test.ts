import { describe, it, expect } from 'vitest'
import { dropTarget } from '../usePointerReorder'

/**
 * The index the gesture produces has to be the one an array move consumes.
 * These tests apply the real splice pair rather than asserting on the number,
 * because the number alone is easy to get right in one direction and wrong in
 * the other.
 */
const move = <T,>(list: T[], from: number, to: number): T[] => {
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const SIZE = 80

describe('dropTarget', () => {
  it('dragging right by one place swaps with the next item', () => {
    const to = dropTarget(SIZE * 1, SIZE, 3)
    expect(to).toBe(1)
    expect(move(['A', 'B', 'C'], 0, to)).toEqual(['B', 'A', 'C'])
  })

  it('dragging left by one place swaps with the previous item', () => {
    const to = dropTarget(SIZE * 1, SIZE, 3)
    expect(move(['A', 'B', 'C'], 2, to)).toEqual(['A', 'C', 'B'])
  })

  it('dragging to the far end moves the item last', () => {
    const to = dropTarget(SIZE * 2, SIZE, 3)
    expect(to).toBe(2)
    expect(move(['A', 'B', 'C'], 0, to)).toEqual(['B', 'C', 'A'])
  })

  it('dragging to the far start moves the item first', () => {
    const to = dropTarget(0, SIZE, 3)
    expect(to).toBe(0)
    expect(move(['A', 'B', 'C'], 2, to)).toEqual(['C', 'A', 'B'])
  })

  it('snaps to the nearer slot, so a half-hearted drag stays put', () => {
    expect(dropTarget(SIZE * 0.4, SIZE, 3)).toBe(0)
    expect(dropTarget(SIZE * 0.6, SIZE, 3)).toBe(1)
  })

  it('clamps past either end rather than returning an index that does not exist', () => {
    expect(dropTarget(-500, SIZE, 3)).toBe(0)
    expect(dropTarget(SIZE * 99, SIZE, 3)).toBe(2)
  })

  it('survives a degenerate list instead of returning NaN', () => {
    expect(dropTarget(120, 0, 3)).toBe(0)
    expect(dropTarget(120, SIZE, 0)).toBe(0)
  })
})
