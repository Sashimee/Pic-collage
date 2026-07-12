export type Lang = 'de' | 'en'

export const LANGS: { id: Lang; flag: string; label: string }[] = [
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
]

// Flat key → string maps. Keep keys stable; English doubles as the fallback.
export const translations: Record<Lang, Record<string, string>> = {
  en: {
    'tab.photos': 'Photos',
    'tab.layout': 'Layout',
    'tab.text': 'Text',
    'tab.stickers': 'Stickers',
    'tab.background': 'Background',
    'tab.filters': 'Filters',

    'aspect.square': 'Square',
    'aspect.portrait': 'Portrait',
    'aspect.story': 'Story',
    'aspect.landscape': 'Landscape',
    'aspect.pin': 'Pin 2:3',
    'aspect.wide': 'Wide',
    'aspect.custom': 'Custom',
    'grid.gap': 'Gutter',
    'grid.radius': 'Corner radius',
    'layout.free': 'Free',
    'grid.hint':
      'Add photos — they fill the grid cells in order. Tap a cell to select it for filters.',

    'photos.add': '🖼️ Add photos',
    'photos.camera': '📷 Camera',

    'text.add': '＋ Add text',
    'text.placeholder': 'Type your text',
    'common.color': 'Color',
    'common.size': 'Size',

    'bg.solid': 'Solid',
    'bg.gradient': 'Gradient',
    'bg.custom': 'Custom',
    'bg.from': 'From',
    'bg.to': 'To',
    'bg.angle': 'Angle',

    'filter.none': 'Original',
    'filter.vivid': 'Vivid',
    'filter.warm': 'Warm',
    'filter.cool': 'Cool',
    'filter.sepia': 'Sepia',
    'filter.grayscale': 'B&W',
    'filter.brightness': 'Brightness',
    'filter.contrast': 'Contrast',
    'filter.saturation': 'Saturation',
    'filter.selectHint': 'Select a photo to apply filters.',

    'header.new': 'New',
    'header.undo': 'Undo',
    'header.redo': 'Redo',
    'header.export': 'Export ▾',
    'export.share': '📤 Share…',
    'export.png': '⬇️ Download PNG',
    'export.jpg': '⬇️ Download JPG',
    'header.clearConfirm': 'Clear the whole canvas?',

    'canvas.editText': 'Edit text',
    'share.title': 'My Collage',
  },
  de: {
    'tab.photos': 'Fotos',
    'tab.layout': 'Layout',
    'tab.text': 'Text',
    'tab.stickers': 'Sticker',
    'tab.background': 'Hintergrund',
    'tab.filters': 'Filter',

    'aspect.square': 'Quadrat',
    'aspect.portrait': 'Hochformat',
    'aspect.story': 'Story',
    'aspect.landscape': 'Querformat',
    'aspect.pin': 'Pin 2:3',
    'aspect.wide': 'Breit',
    'aspect.custom': 'Eigene',
    'grid.gap': 'Abstand',
    'grid.radius': 'Eckenradius',
    'layout.free': 'Frei',
    'grid.hint':
      'Füge Fotos hinzu — sie füllen die Rasterfelder der Reihe nach. Tippe ein Feld an, um es für Filter auszuwählen.',

    'photos.add': '🖼️ Fotos hinzufügen',
    'photos.camera': '📷 Kamera',

    'text.add': '＋ Text hinzufügen',
    'text.placeholder': 'Text eingeben',
    'common.color': 'Farbe',
    'common.size': 'Größe',

    'bg.solid': 'Einfarbig',
    'bg.gradient': 'Verlauf',
    'bg.custom': 'Eigene',
    'bg.from': 'Von',
    'bg.to': 'Bis',
    'bg.angle': 'Winkel',

    'filter.none': 'Original',
    'filter.vivid': 'Kräftig',
    'filter.warm': 'Warm',
    'filter.cool': 'Kühl',
    'filter.sepia': 'Sepia',
    'filter.grayscale': 'S/W',
    'filter.brightness': 'Helligkeit',
    'filter.contrast': 'Kontrast',
    'filter.saturation': 'Sättigung',
    'filter.selectHint': 'Wähle ein Foto aus, um Filter anzuwenden.',

    'header.new': 'Neu',
    'header.undo': 'Rückgängig',
    'header.redo': 'Wiederholen',
    'header.export': 'Export ▾',
    'export.share': '📤 Teilen…',
    'export.png': '⬇️ PNG herunterladen',
    'export.jpg': '⬇️ JPG herunterladen',
    'header.clearConfirm': 'Die ganze Leinwand leeren?',

    'canvas.editText': 'Text bearbeiten',
    'share.title': 'Meine Collage',
  },
}
