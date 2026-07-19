/**
 * Performance monitoring — lightweight marks + measures for key interactions.
 * Integrates with PerformanceObserver if available, falls back to console.
 */

const PERF_PREFIX = 'pic-collage:'

export function perfMark(name: string) {
  const mark = `${PERF_PREFIX}${name}`
  if (typeof performance !== 'undefined' && 'mark' in performance) {
    performance.mark(mark)
  }
}

export function perfMeasure(name: string, startMark: string, endMark?: string) {
  const m = `${PERF_PREFIX}${name}`
  const s = `${PERF_PREFIX}${startMark}`
  const e = endMark ? `${PERF_PREFIX}${endMark}` : undefined
  if (typeof performance !== 'undefined' && 'measure' in performance) {
    try {
      performance.measure(m, s, e)
    } catch {
      // marks may not exist — silently ignore
    }
  }
}

export function getMeasures(): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && 'getEntriesByType' in performance) {
    return performance.getEntriesByType('measure').filter((e) =>
      e.name.startsWith(PERF_PREFIX),
    )
  }
  return []
}

export function clearMeasures() {
  if (typeof performance !== 'undefined' && 'clearMeasures' in performance) {
    performance.clearMeasures(PERF_PREFIX)
  }
}

/** Log a custom metric to the console (and eventually to analytics) */
export function logMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') {
  const payload = { name: `${PERF_PREFIX}${name}`, value, unit, timestamp: Date.now() }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[metric]', payload)
  }
  // In production this could send to a telemetry endpoint (with user consent)
}
