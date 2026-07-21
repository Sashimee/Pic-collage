declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
  }

  interface FrameOptions {
    copy?: boolean
    delay?: number
  }

  class GIF {
    constructor(options: GIFOptions)
    addFrame(ctx: CanvasRenderingContext2D, options?: FrameOptions): void
    render(): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
  }

  export default GIF
}
