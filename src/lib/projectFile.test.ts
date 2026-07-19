import { describe, it, expect } from 'vitest'
import { packProject, unpackProject } from './projectFile'
import type { LoadedDocument } from '../store/editorStore'

describe('projectFile', () => {
  const sampleDoc: LoadedDocument = {
    boardWidth: 1080,
    boardHeight: 1350,
    background: { type: 'solid', color: '#fff', gradientFrom: '#6366f1', gradientTo: '#ec4899', gradientAngle: 45, patternId: 'dots', patternColor: '#6366f1' },
    mode: 'free',
    gridId: null,
    gridGap: 12,
    gridRadius: 0,
    frame: { style: 'none', color: '#fff', width: 0.04 },
    elements: [],
  }

  it('packs and unpacks a project', async () => {
    const blob = await packProject('Test', sampleDoc)
    expect(blob.type).toBe('application/json')

    const result = await unpackProject(blob)
    expect(result.name).toBe('Test')
    expect(result.doc.boardWidth).toBe(1080)
    expect(result.doc.background.type).toBe('solid')
  })

  it('throws on unsupported version', async () => {
    const badBlob = new Blob([JSON.stringify({ version: 99 })], { type: 'application/json' })
    await expect(unpackProject(badBlob)).rejects.toThrow('Unsupported')
  })
})
