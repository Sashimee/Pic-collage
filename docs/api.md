# Developer API Reference

## Store API

### `useEditor` (Zustand)
Core editor state and actions. See `src/store/editorStore.ts`.

```typescript
interface EditorState {
  boardWidth: number
  boardHeight: number
  background: Background
  mode: EditorMode
  gridId: string | null
  elements: CanvasElement[]
  selectedId: string | null
  
  addPhoto(src, width, height): void
  addText(): void
  addSticker(emoji): void
  updateElement(id, patch): void
  removeElement(id): void
  undo(): void
  redo(): void
  loadDocument(doc): void
}
```

### `useProjects` (Zustand)
Multi-project management. See `src/store/projectsStore.ts`.

```typescript
interface ProjectsState {
  projects: ProjectMeta[]
  activeProjectId: string | null
  
  createProject(name): Promise<string>
  openProject(id): Promise<void>
  renameProject(id, name): Promise<void>
  duplicateProject(id): Promise<string>
  deleteProject(id): Promise<void>
  saveActiveProject(): Promise<void>
}
```

## Plugin API

### Filter Plugin
```typescript
interface FilterPlugin {
  id: string
  name: string
  nameDe: string
  apply: (filters: PhotoFilters) => Partial<PhotoFilters>
}
```

Register via `registerFilter(plugin)` in `src/lib/plugins/registry.ts`.

### Sticker Pack Plugin
```typescript
interface StickerPackPlugin {
  id: string
  name: string
  nameDe: string
  emojis: string[]
}
```

Register via `registerStickerPack(pack)` in `src/lib/plugins/registry.ts`.

## File Format

### `.piccollage`
A JSON file with embedded base64-encoded photos.

```typescript
interface PicCollageFile {
  version: 1
  project: { name: string; createdAt: number; updatedAt: number }
  doc: LoadedDocument        // editor state
  photos: Record<string, string>  // photoId <-> base64 data URL
}
```

Pack: `packProject(name, doc) => Blob`
Unpack: `unpackProject(blob) => { name, doc }`

## Data Model

See `src/types.ts` for full type definitions.

- `CanvasElement` union: `PhotoElement | TextElement | StickerElement | DrawingElement`
- `BaseElement`: id, type, x, y, rotation, scaleX, scaleY, opacity?, blendMode?, hidden?, locked?
- `Background`: solid | gradient | pattern | photo
- `Frame`: none | solid | rounded | polaroid
- `GridLayout`: normalized cells for collage templates
