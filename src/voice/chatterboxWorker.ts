let session: any = null;

async function loadModel() {
  const { InferenceSession, Tensor } = await import('onnxruntime-web');
  session = await InferenceSession.create('/wasm/chatterbox_q4.wasm', {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, text, speakerId } = event.data;

  if (type === 'init') {
    await loadModel();
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type === 'synthesize' && session) {
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    const { Tensor } = await import('onnxruntime-web');
    const inputTensor = new Tensor('uint8', textBytes, [1, textBytes.length]);
    const speakerTensor = new Tensor('int64', [BigInt(speakerId ?? 0)], [1]);

    const result = await session.run({ text: inputTensor, speaker_id: speakerTensor });
    const audioData = result.audio.data as Float32Array;

    self.postMessage({ type: 'audio', audioData }, [audioData.buffer]);
  }
});

export {};
