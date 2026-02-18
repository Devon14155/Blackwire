import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const DIMENSIONS = 384;

let extractionPipeline: FeatureExtractionPipeline | null = null;
let isLoading = false;
let loadingPromise: Promise<FeatureExtractionPipeline> | null = null;

export interface EmbeddingProgress {
  status: "loading" | "ready" | "error";
  progress: number;
  message: string;
}

type ProgressCallback = (progress: EmbeddingProgress) => void;

async function loadModel(onProgress?: ProgressCallback): Promise<FeatureExtractionPipeline> {
  if (extractionPipeline) {
    return extractionPipeline;
  }

  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  isLoading = true;
  onProgress?.({ status: "loading", progress: 0, message: "Initializing embedding model..." });

  try {
    loadingPromise = pipeline("feature-extraction", MODEL_NAME, {
      progress_callback: (progress: { status?: string; progress?: number; message?: string }) => {
        if (progress.status === "downloading") {
          const pct = progress.progress ?? 0;
          onProgress?.({
            status: "loading",
            progress: pct,
            message: `Downloading model: ${Math.round(pct)}%`
          });
        } else if (progress.status === "loading") {
          onProgress?.({
            status: "loading",
            progress: 100,
            message: "Loading model into memory..."
          });
        }
      }
    });

    extractionPipeline = await loadingPromise;
    isLoading = false;
    onProgress?.({ status: "ready", progress: 100, message: "Model ready" });
    return extractionPipeline;
  } catch (error) {
    isLoading = false;
    loadingPromise = null;
    onProgress?.({
      status: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Failed to load model"
    });
    throw error;
  }
}

export const EmbeddingService = {
  getDimensions(): number {
    return DIMENSIONS;
  },

  async initialize(onProgress?: ProgressCallback): Promise<void> {
    await loadModel(onProgress);
  },

  async generateEmbedding(text: string, onProgress?: ProgressCallback): Promise<number[]> {
    const model = await loadModel(onProgress);
    
    const cleanText = text.trim().slice(0, 8000);
    
    const output = await model(cleanText, {
      pooling: "mean",
      normalize: true
    });

    const vector = Array.from(output.data as Float32Array);
    return vector;
  },

  async generateBatchEmbeddings(texts: string[], onProgress?: ProgressCallback): Promise<number[][]> {
    const model = await loadModel(onProgress);
    
    const cleanTexts = texts.map(t => t.trim().slice(0, 8000));
    
    const results: number[][] = [];
    for (const text of cleanTexts) {
      const output = await model(text, {
        pooling: "mean",
        normalize: true
      });
      results.push(Array.from(output.data as Float32Array));
    }
    
    return results;
  },

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  },

  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  },

  isReady(): boolean {
    return extractionPipeline !== null;
  }
};