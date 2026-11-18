/**
 * LifeOS — Client-Side Vector Memory Engine
 * Runs in-browser cosine similarity search against user preferences and historical logs.
 * Storage: IndexedDB (Store: 'luna_vector_memory')
 */

export interface MemoryVectorRecord {
  id: string;
  category: 'preference' | 'injury' | 'study_goal' | 'dietary' | 'habit';
  textSnippet: string;
  embedding: number[];
  createdAt: number;
  lastRecalledAt: number;
}

export class LunaVectorMemory {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'lifeos_vector_store';
  private readonly STORE_NAME = 'memory_embeddings';

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * High-performance Dot Product Cosine Similarity for normalized vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    const len = a.length;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  /**
   * Save or update a memory snippet
   */
  async upsertMemory(
    id: string,
    category: MemoryVectorRecord['category'],
    textSnippet: string,
    embedding: number[]
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const record: MemoryVectorRecord = {
        id,
        category,
        textSnippet,
        embedding,
        createdAt: Date.now(),
        lastRecalledAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Query top-K most semantically relevant memories
   */
  async queryTopK(
    queryEmbedding: number[],
    topK: number = 3,
    similarityThreshold: number = 0.62
  ): Promise<{ text: string; score: number; category: string }[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const cursorReq = store.openCursor();
      const scoredResults: { text: string; score: number; category: string }[] = [];

      cursorReq.onsuccess = (e: Event) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const rec: MemoryVectorRecord = cursor.value;
          const score = this.cosineSimilarity(queryEmbedding, rec.embedding);
          if (score >= similarityThreshold) {
            scoredResults.push({
              text: rec.textSnippet,
              score,
              category: rec.category,
            });
          }
          cursor.continue();
        } else {
          scoredResults.sort((a, b) => b.score - a.score);
          resolve(scoredResults.slice(0, topK));
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }
}

export const vectorMemory = new LunaVectorMemory();

