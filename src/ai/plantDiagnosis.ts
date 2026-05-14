import * as ort from 'onnxruntime-web';

const CLASS_NAMES = [
  'Apple_Black_Rot', 'Apple_Healthy', 'Apple_Scab', 'Cherry_Powdery_Mildew',
  'Grape_Black_Rot', 'Peach_Bacterial_Spot', 'Potato_Early_Blight', 'Potato_Late_Blight',
  'Tomato_Bacterial_Spot', 'Tomato_Early_Blight', 'Tomato_Healthy', 'Tomato_Late_Blight',
  'Tomato_Septoria_Leaf_Spot', 'Tomato_Spider_Mites', 'Rose_Black_Spot', 'Rose_Healthy',
  'Rose_Powdery_Mildew', 'Boxwood_Blight', 'Turf_Brown_Patch', 'Turf_Healthy',
];

const TREATMENTS: Record<string, { chemical: string; organic: string }> = {
  Black_Rot: { chemical: 'Captan fungicide', organic: 'Copper soap + pruning' },
  Powdery_Mildew: { chemical: 'Myclobutanil', organic: 'Neem oil + baking soda spray' },
  Early_Blight: { chemical: 'Chlorothalonil', organic: 'Copper fungicide + crop rotation' },
  Late_Blight: { chemical: 'Mancozeb', organic: 'Bacillus subtilis + resistant varieties' },
  Leaf_Spot: { chemical: 'Propiconazole', organic: 'Sulfur spray + improved air flow' },
  Black_Spot: { chemical: 'Tebuconazole', organic: 'Neem oil + fallen leaf removal' },
};

let session: ort.InferenceSession | null = null;

export async function loadDiagnosisModel() {
  session = await ort.InferenceSession.create('/models/plant_disease_mobilenetv2.onnx', {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });
}

export interface DiagnosisResult {
  disease: string;
  confidence: number;
  chemicalTreatment: string;
  organicTreatment: string;
}

export async function diagnosePlant(imageData: ImageData): Promise<DiagnosisResult[]> {
  if (!session) throw new Error('Model not loaded');

  const canvas = new OffscreenCanvas(224, 224);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(await createImageBitmap(imageData), 0, 0, 224, 224);
  const imgData = ctx.getImageData(0, 0, 224, 224);

  const input = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) {
    input[i] = imgData.data[i * 4] / 255.0;
    input[224 * 224 + i] = imgData.data[i * 4 + 1] / 255.0;
    input[2 * 224 * 224 + i] = imgData.data[i * 4 + 2] / 255.0;
  }

  const tensor = new ort.Tensor('float32', input, [1, 3, 224, 224]);
  const feeds = { input: tensor };
  const results = await session.run(feeds);
  const logits = results.output.data as Float32Array;

  const expSum = logits.reduce((s: number, v: number) => s + Math.exp(v), 0);
  const probs = logits.map((v: number) => Math.exp(v) / expSum);

  const indexed = Array.from(probs).map((v: number, i: number) => ({ v, i }));
  indexed.sort((a, b) => b.v - a.v);
  const top3 = indexed.slice(0, 3);

  return top3.map(({ v, i }) => {
    const diseaseName = CLASS_NAMES[i].replace(/_/g, ' ');
    const diseaseKey = CLASS_NAMES[i].split('_').slice(1).join('_') || CLASS_NAMES[i];
    const treatment = TREATMENTS[diseaseKey] || { chemical: 'Consult local nursery', organic: 'Consult local nursery' };
    return { disease: diseaseName, confidence: v, chemicalTreatment: treatment.chemical, organicTreatment: treatment.organic };
  });
}
