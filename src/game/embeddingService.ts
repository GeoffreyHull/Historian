/**
 * EmbeddingService: Offline semantic similarity engine.
 * Phase 2: Abstract interface with Jaccard (dev/test) and Transformers.js (production) implementations.
 * Switch implementations at runtime via dependency injection.
 */

import { STOP_WORDS } from "./constants";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function computeJaccardSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  const intersection = [...tokens1].filter((t) => tokens2.has(t)).length;
  const union = new Set([...tokens1, ...tokens2]).size;
  return Math.round((intersection / union) * 100);
}

export interface EmbeddingService {
  computeSimilarity(text1: string, text2: string): Promise<number>;
}

export class JaccardEmbeddingService implements EmbeddingService {
  async computeSimilarity(text1: string, text2: string): Promise<number> {
    return computeJaccardSimilarity(text1, text2);
  }
}

export class TransformersEmbeddingService implements EmbeddingService {
  private pipeline: any = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const { pipeline } = await import("@xenova/transformers");
      this.pipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      this.initialized = true;
    }
  }

  async computeSimilarity(text1: string, text2: string): Promise<number> {
    await this.ensureInitialized();
    const emb1 = await this.embed(text1);
    const emb2 = await this.embed(text2);
    return this.cosineSimilarity(emb1, emb2);
  }

  private async embed(text: string): Promise<Float32Array> {
    const result = await this.pipeline!(text, {
      pooling: "mean",
      normalize: true,
    });
    return result.data as Float32Array;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.round(similarity * 100);
  }
}

export const defaultEmbeddingService = new JaccardEmbeddingService();
