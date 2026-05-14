export interface SemanticQuery {
  text: string;
  embedding?: Float32Array;
}

export class SemanticPhiEngine {
  private embeddings: Map<string, Float32Array> = new Map();

  async embedText(text: string): Promise<Float32Array> {
    if (this.embeddings.has(text)) return this.embeddings.get(text)!;

    const cached = new Float32Array(384);
    const bytes = new TextEncoder().encode(text);
    for (let i = 0; i < bytes.length && i < 384; i++) {
      cached[i] = bytes[i] / 255.0;
    }
    this.embeddings.set(text, cached);
    return cached;
  }

  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async queryNearest(query: string, candidates: string[]): Promise<string[]> {
    const qEmbed = await this.embedText(query);
    const scored = await Promise.all(
      candidates.map(async c => ({
        text: c,
        score: this.cosineSimilarity(qEmbed, await this.embedText(c)),
      }))
    );
    return scored.sort((a, b) => b.score - a.score).map(s => s.text);
  }
}
