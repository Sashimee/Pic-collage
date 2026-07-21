// WebGPU compute shader backend for brightness / contrast.
// Falls back to Canvas 2D when WebGPU is unavailable.

/** Detect WebGPU support. */
export async function isWebGPUAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !(navigator as any).gpu) return false
  const adapter = await (navigator as any).gpu.requestAdapter()
  return adapter != null
}

// ---- WebGPU ----------------------------------------------------------------

const WGSL = `
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

struct Params {
  brightness: f32,
  contrast: f32,
};
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let dims = textureDimensions(inputTex);
  if (global_id.x >= dims.x || global_id.y >= dims.y) { return; }
  let color = textureLoad(inputTex, vec2<i32>(global_id.xy), 0);
  let b = params.brightness;
  let c = params.contrast;
  let contrastFactor = c;
  let adjusted = (color.rgb - 0.5) * contrastFactor + 0.5 + b;
  textureStore(outputTex, vec2<i32>(global_id.xy), vec4<f32>(adjusted, color.a));
}
`

let gpuDevicePromise: Promise<any> | null = null

async function getGPUDevice(): Promise<any | null> {
  if (gpuDevicePromise) return gpuDevicePromise
  gpuDevicePromise = (async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).gpu) return null
    const adapter = await (navigator as any).gpu.requestAdapter()
    if (!adapter) return null
    return (await adapter.requestDevice()) || null
  })()
  return gpuDevicePromise
}

/**
 * Adjust brightness/contrast using a WebGPU compute shader.
 * Returns a new ImageBitmap.
 */
export async function adjustBrightnessContrastWebGPU(
  image: ImageBitmap,
  brightness: number,
  contrast: number,
): Promise<ImageBitmap> {
  const d = await getGPUDevice()
  if (!d) {
    throw new Error('WebGPU not available — use adjustBrightnessContrastCanvas instead')
  }

  const width = image.width
  const height = image.height

  const GPUTextureUsage = (globalThis as any).GPUTextureUsage || {
    TEXTURE_BINDING: 4,
    COPY_DST: 2,
    COPY_SRC: 1,
    STORAGE_BINDING: 8,
  }
  const GPUBufferUsage = (globalThis as any).GPUBufferUsage || {
    UNIFORM: 64,
    COPY_DST: 8,
    MAP_READ: 1,
  }
  const GPUShaderStage = (globalThis as any).GPUShaderStage || { COMPUTE: 4 }
  const GPUMapMode = (globalThis as any).GPUMapMode || { READ: 1 }

  // Create input texture from ImageBitmap
  const inputTexture = d.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC,
  })

  d.queue.copyExternalImageToTexture(
    { source: image },
    { texture: inputTexture },
    { width, height },
  )

  // Create output storage texture
  const outputTexture = d.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
  })

  // Uniform buffer
  const uniformBuffer = d.createBuffer({
    size: 8, // 2 x f32
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const uniformData = new Float32Array([brightness, contrast])
  d.queue.writeBuffer(uniformBuffer, 0, uniformData)

  // Shader module
  const shaderModule = d.createShaderModule({ code: WGSL })

  // Bind group layout
  const bindGroupLayout = d.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        texture: { sampleType: 'unfilterable-float', viewDimension: '2d' },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: { access: 'write-only', format: 'rgba8unorm', viewDimension: '2d' },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'uniform' },
      },
    ],
  })

  // Pipeline
  const pipelineLayout = d.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] })
  const pipeline = d.createComputePipeline({
    layout: pipelineLayout,
    compute: { module: shaderModule, entryPoint: 'main' },
  })

  // Bind group
  const bindGroup = d.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: outputTexture.createView() },
      { binding: 2, resource: { buffer: uniformBuffer } },
    ],
  })

  // Encode and submit
  const commandEncoder = d.createCommandEncoder()
  const passEncoder = commandEncoder.beginComputePass()
  passEncoder.setPipeline(pipeline)
  passEncoder.setBindGroup(0, bindGroup)
  passEncoder.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8))
  passEncoder.end()

  // Copy output texture to buffer for readback
  const bytesPerRow = width * 4
  const paddedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256
  const outputBufferSize = paddedBytesPerRow * height
  const outputBuffer = d.createBuffer({
    size: outputBufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })

  commandEncoder.copyTextureToBuffer(
    { texture: outputTexture },
    { buffer: outputBuffer, bytesPerRow: paddedBytesPerRow, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  )

  d.queue.submit([commandEncoder.finish()])

  // Read back
  await outputBuffer.mapAsync(GPUMapMode.READ)
  const mapped = new Uint8Array(outputBuffer.getMappedRange())
  const pixelData = new Uint8ClampedArray(width * height * 4)
  for (let row = 0; row < height; row++) {
    const srcOffset = row * paddedBytesPerRow
    const dstOffset = row * bytesPerRow
    pixelData.set(mapped.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset)
  }
  outputBuffer.unmap()

  // Create ImageBitmap from ImageData
  const imageData = new ImageData(pixelData, width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return createImageBitmap(canvas)
}

// ---- Canvas 2D fallback ----------------------------------------------------

/**
 * Adjust brightness/contrast using Canvas 2D.
 * brightness: shift (-1 .. 1)
 * contrast:  multiplier (0 .. 2, 1 = neutral)
 */
export async function adjustBrightnessContrastCanvas(
  image: ImageBitmap,
  brightness: number,
  contrast: number,
): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const b = brightness
  const c = contrast

  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const v = data[i + ch] / 255
      const adjusted = (v - 0.5) * c + 0.5 + b
      data[i + ch] = Math.max(0, Math.min(255, Math.round(adjusted * 255)))
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return createImageBitmap(canvas)
}

// ---- Convenience -----------------------------------------------------------

/** Auto-select WebGPU when available, otherwise Canvas 2D. */
export async function adjustBrightnessContrast(
  image: ImageBitmap,
  brightness: number,
  contrast: number,
): Promise<ImageBitmap> {
  if (await isWebGPUAvailable()) {
    return adjustBrightnessContrastWebGPU(image, brightness, contrast)
  }
  return adjustBrightnessContrastCanvas(image, brightness, contrast)
}
