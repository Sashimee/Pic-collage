# Architecture Decision Record: Client-Only Architecture

## Status
Accepted

## Context
The Pic Collage Maker is a browser-based photo collage editor. The user explicitly requested:
- No backend server
- No user accounts or authentication
- No data leaves the device
- Static files hosted on GitHub Pages

## Decision
Keep the application 100% client-side. All state lives in the browser (Zustand stores, IndexedDB for persistence, Blob URLs for photos). Export is via browser download or Web Share API.

## Consequences

### Positive
- Full privacy — photos never uploaded
- Free hosting on GitHub Pages
- Works offline as PWA
- No server maintenance or scaling concerns
- Fast — no network round-trips for editing

### Negative
- No cross-device sync (unless user manually exports/imports `.piccollage` files)
- No real-time collaboration
- Storage limited by device capacity
- No server-side rendering for SEO

## Alternatives Considered
- **Firebase/backend**: Rejected — violates privacy-first requirement
- **Peer-to-peer sync (WebRTC)**: Deferred — too complex for v1
- **GitHub Gist as cloud storage**: Considered but deferred — API rate limits and complexity

## Date
2026-07-19
