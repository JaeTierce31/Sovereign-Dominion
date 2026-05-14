export interface LidarFrame {
  depthMap: Float32Array;
  width: number;
  height: number;
  timestamp: number;
  intrinsics: { fx: number; fy: number; cx: number; cy: number };
}

let depthTexture: GPUTexture | null = null;
let device: GPUDevice | null = null;

export function setGPUDevice(d: GPUDevice) { device = d; }

export function updateDepthTexture(frame: LidarFrame) {
  if (!device) return;
  if (!depthTexture) {
    depthTexture = device.createTexture({
      size: [frame.width, frame.height],
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
  }
  device.queue.writeTexture(
    { texture: depthTexture },
    frame.depthMap,
    { bytesPerRow: frame.width * 4, rowsPerImage: frame.height },
    [frame.width, frame.height, 1]
  );
}

export function getDepthTexture() { return depthTexture; }
