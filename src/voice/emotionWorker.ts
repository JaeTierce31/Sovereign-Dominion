import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

const EMOTION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted'];

async function init() {
  session = await ort.InferenceSession.create('/models/wav2vec2_emotion.onnx', {
    executionProviders: ['wasm'],
  });
  self.postMessage({ type: 'ready' });
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, audioBuffer } = event.data;

  if (type === 'init') {
    await init();
    return;
  }

  if (type === 'analyze' && session) {
    const tensor = new ort.Tensor('float32', audioBuffer, [1, audioBuffer.length]);
    const result = await session.run({ input_values: tensor });
    const logits = result.logits.data as Float32Array;
    const maxIdx = logits.reduce((best, v, i) => v > logits[best] ? i : best, 0);

    self.postMessage({ type: 'emotion', emotion: EMOTION_LABELS[maxIdx], confidence: logits[maxIdx] });
  }
});

export {};
