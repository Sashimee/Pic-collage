import { useEditor } from '../store/editorStore'

export default function LayerPanel() {
  const {
    elements,
    selectedId,
    setElementHidden,
    setElementLocked,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    select,
  } = useEditor.getState()

  const toggleHidden = (id: string) => {
    const el = elements.find((e) => e.id === id)
    if (el) setElementHidden(id, !(el as any).hidden)
  }
  const toggleLocked = (id: string) => {
    const el = elements.find((e) => e.id === id)
    if (el) setElementLocked(id, !(el as any).locked)
  }

  return (
    <div className="layer-panel">
      <h3>Layers</h3>
      <ul>
        {elements.map((el) => (
          <li key={el.id} style={{ opacity: (el as any).hidden ? 0.4 : 1 }}>
            <button
              onClick={() => select(el.id)}
              style={{ fontWeight: selectedId === el.id ? 'bold' : 'normal' }}
            >
              {el.type} ({el.id.slice(0, 4)})
            </button>
            <button onClick={() => toggleHidden(el.id)} title="Hide/Show">
              {(el as any).hidden ? '👁️‍🗨️' : '👁️'}
            </button>
            <button onClick={() => toggleLocked(el.id)} title="Lock/Unlock">
              {(el as any).locked ? '🔒' : '🔓'}
            </button>
            <button onClick={() => bringForward(el.id)} title="Bring Forward">
              ⬆️
            </button>
            <button onClick={() => sendBackward(el.id)} title="Send Backward">
              ⬇️
            </button>
            <button onClick={() => bringToFront(el.id)} title="Bring To Front">
              ⤴️
            </button>
            <button onClick={() => sendToBack(el.id)} title="Send To Back">
              ⤵️
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
