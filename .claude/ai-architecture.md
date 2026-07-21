# Pic-Collage AI Architecture — Permanent Reference

**Date:** 2026-07-21  
**Status:** Active (do not change without explicit request)

## ⚠️ CRITICAL: No External ML Models

All AI features in Pic-Collage use **client-side Canvas algorithms only**.
**Do NOT** attempt to download, reference, or use:
- ONNX Runtime Web model files (`.onnx`)
- face-api.js neural network weights
- Any external ML model hosted on CDN

The previous approach using `onnxruntime-web` + `face-api.js` was **removed** because:
1. Model files (`/models/rmbg-2-optimized.onnx`, `/models/face-api/*`) were missing from the repo
2. Users saw "BG removal failed" on every attempt
3. 40MB+ downloads were required on first use
4. Broke on GitHub Pages (no backend to serve models)

## Current Implementation

| Feature | File | Algorithm |
|---------|------|-----------|
| Background Removal | `src/ai/bgRemoval.ts` | Flood-fill edge sampling + color distance + feather |
| Face Detection | `src/ai/faceDetection.ts` | Skin-tone region sampling + center-of-mass |
| Smart Crop | `src/ai/faceDetection.ts` | `computeSmartCrop()` centers crop on face region |
| Portrait Retouch | `src/ai/portraitRetouch.ts` | Canvas pixel smoothing, eye brighten, teeth whiten |
| Auto-Enhance | `src/ai/autoEnhance.ts` | Histogram equalization + contrast stretch |
| Style Transfer | `src/ai/styleTransfer.ts` | Canvas convolution kernels (oil, sketch, popart) |
| Heal Tool | `src/ai/healTool.ts` | Clone stamp with soft edges |
| Text Suggestions | `src/ai/textSuggestions.ts` | Color analysis → mood → caption |

## Bundle Impact

- **With ONNX + face-api.js:** ~2500 KiB
- **Current (Canvas-only):** ~1480 KiB
- **Savings:** ~1020 KiB (removed `onnxruntime-web` dependency entirely)

## Constraints

- Works offline (no network required after page load)
- No WASM loading delays
- Best on photos with distinct backgrounds (solid color, white wall)
- May struggle with: complex backgrounds matching subject color, very low resolution images

## If Asked About AI Models in Future

**Respond immediately:** "Pic-Collage AI is entirely client-side Canvas-based. There are no ONNX or face-api.js model files in the repo. The algorithms are self-contained in `src/ai/` and work purely with HTMLImageElement + Canvas pixel manipulation."
