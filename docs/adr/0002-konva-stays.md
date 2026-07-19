# Architecture Decision Record: Konva Canvas Engine

## Status
Accepted

## Context
The editor needs a 2D scene graph for photo compositing, text, stickers, and drawings. Options included:
- HTML5 Canvas 2D (raw)
- Fabric.js
- PixiJS (WebGL)
- Konva.js + react-konva

## Decision
Continue with Konva.js (already in use) and react-konva for React integration.

## Rationale
- Existing investment — codebase already built on Konva
- react-konva provides declarative React bindings
- Sufficient for 2D compositing (photos, text, shapes, filters)
- Transformer (move/resize/rotate) works out of the box
- Filter system (Brighten, Contrast, HSL, Blur) is built-in

## Consequences

### Positive
- No migration cost
- Mature, stable API
- Good performance for the target use case (10-50 layers)

### Negative
- Not WebGL-accelerated — very large canvases (5000×5000+) may be slow
- Filter stack is limited to what Konva provides
- No native vector text rendering

## Alternatives Considered
- **PixiJS**: Better performance but would require full rewrite, no built-in transformer
- **Fabric.js**: Similar feature set but less React-friendly
- **Raw Canvas 2D**: Too much boilerplate for scene graph

## Date
2026-07-19
