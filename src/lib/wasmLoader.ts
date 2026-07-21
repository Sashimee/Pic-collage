// wasmLoader.ts — lazy-load ONNX models with IndexedDB caching
// ---------------------------------------------------------------------------
// This module provides a lightweight wrapper around onnxruntime-web that:
//   1. Detects the best execution provider (WebGPU → WebGL → WASM)
//   2. Caches downloaded model buffers in IndexedDB so repeat loads are instant
//   3. Exposes a React-friendly progress spinner component

import * as ort from 'onnxruntime-web'

const DB_NAME = 'piccollage-models'
const DB_VERSION = 1
const STORE_NAME = 'models'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
  })
  return dbPromise
}

async function getCachedBuffer(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result as ArrayBuffer | undefined ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function setCachedBuffer(key: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(buffer, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // silently fail — caching is best-effort
  }
}

export interface LoadProgress {
  loaded: number
  total: number
  pct: number
}

type ProgressCallback = (p: LoadProgress) => void

async function fetchWithProgress(
  url: string,
  onProgress?: ProgressCallback,
): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load model: ${res.status}`)
  const total = parseInt(res.headers.get('content-length') || '0', 10)
  const reader = res.body!.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      loaded += value.length
      onProgress?.({ loaded, total, pct: total ? loaded / total : 0 })
    }
  }
  const blob = new Blob(chunks.map((c) => c.buffer as BlobPart))
  return blob.arrayBuffer()
}

export interface ModelConfig {
  url: string
  key: string // cache key
}

export interface LoadedModel {
  session: ort.InferenceSession
  config: ModelConfig
}

const activeSessions = new Map<string, LoadedModel>()

/** Detect the best available ONNX execution provider. */
export function detectBackend(): 'webgpu' | 'webgl' | 'wasm' {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    return 'webgpu'
  }
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (gl) {
    return 'webgl'
  }
  return 'wasm'
}

/** Load an ONNX model from URL (with IndexedDB caching). */
export async function loadModel(
  config: ModelConfig,
  onProgress?: ProgressCallback,
): Promise<LoadedModel> {
  const existing = activeSessions.get(config.key)
  if (existing) return existing

  let buffer = await getCachedBuffer(config.key)
  if (!buffer) {
    buffer = await fetchWithProgress(config.url, onProgress)
    await setCachedBuffer(config.key, buffer)
  } else {
    onProgress?.({ loaded: buffer.byteLength, total: buffer.byteLength, pct: 1 })
  }

  const backend = detectBackend()
  const eps: string[] = backend === 'webgpu'
    ? ['webgpu', 'cpu']
    : backend === 'webgl'
      ? ['webgl', 'cpu']
      : ['cpu']

  const session = await ort.InferenceSession.create(buffer, {
    executionProviders: eps as any,
    graphOptimizationLevel: 'all',
  })

  const loaded: LoadedModel = { session, config }
  activeSessions.set(config.key, loaded)
  return loaded
}

/** Release a loaded model session and remove it from the in-memory cache. */
export async function releaseModel(key: string): Promise<void> {
  const loaded = activeSessions.get(key)
  if (loaded) {
    await loaded.session.release()
    activeSessions.delete(key)
  }
}

/** Clear all cached model buffers from IndexedDB. */
export async function clearModelCache(): Promise<void> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // ignore
  }
}
