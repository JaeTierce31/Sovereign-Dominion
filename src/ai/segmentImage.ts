import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function initSegmentation() {
  session = await ort.InferenceSession.create('/models/segformer_b0_quant.onnx', {
    executionProviders: ['webgpu', 'wasm'],
  });
}

export async function segmentImage(imageData: ImageData): Promise<Uint8Array> {
  if (!session) throw new Error('Segmentation model not initialized');

  const W = 512, H = 512;
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(await createImageBitmap(imageData), 0, 0, W, H);
  const img = ctx.getImageData(0, 0, W, H);

  const input = new Float32Array(3 * W * H);
  for (let i = 0; i < W * H; i++) {
    input[i] = img.data[i * 4] / 255.0;
    input[W * H + i] = img.data[i * 4 + 1] / 255.0;
    input[2 * W * H + i] = img.data[i * 4 + 2] / 255.0;
  }

  const tensor = new ort.Tensor('float32', input, [1, 3, H, W]);
  const result = await session.run({ pixel_values: tensor });
  const logits = result.logits.data as Float32Array;

  const numClasses = logits.length / (W * H);
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    let maxVal = -Infinity, maxClass = 0;
    for (let c = 0; c < numClasses; c++) {
      const v = logits[c * W * H + i];
      if (v > maxVal) { maxVal = v; maxClass = c; }
    }
    mask[i] = maxClass;
  }
  return mask;
}
