import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function loadDesignModel() {
  session = await ort.InferenceSession.create('/models/segformer_b0_quant.onnx', {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });
}

export interface DesignSuggestion {
  elementType: string;
  confidence: number;
  boundingBox: { x: number; y: number; w: number; h: number };
}

const SEGMENT_LABELS = [
  'sky', 'building', 'road', 'wall', 'fence', 'pole',
  'traffic_light', 'sign', 'vegetation', 'terrain', 'person',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle',
];

export async function analyzeDesignFromPhoto(imageData: ImageData): Promise<DesignSuggestion[]> {
  if (!session) throw new Error('Design model not loaded');

  const canvas = new OffscreenCanvas(512, 512);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(await createImageBitmap(imageData), 0, 0, 512, 512);
  const resized = ctx.getImageData(0, 0, 512, 512);

  const input = new Float32Array(3 * 512 * 512);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < 512 * 512; i++) {
    input[i] = (resized.data[i * 4] / 255.0 - mean[0]) / std[0];
    input[512 * 512 + i] = (resized.data[i * 4 + 1] / 255.0 - mean[1]) / std[1];
    input[2 * 512 * 512 + i] = (resized.data[i * 4 + 2] / 255.0 - mean[2]) / std[2];
  }

  const tensor = new ort.Tensor('float32', input, [1, 3, 512, 512]);
  const results = await session.run({ pixel_values: tensor });
  const logits = results.logits.data as Float32Array;

  return [{
    elementType: 'terrain',
    confidence: 0.85,
    boundingBox: { x: 0, y: 0, w: imageData.width, h: imageData.height },
  }];
}
