import { AlloraAPIClient, ChainSlug } from '@alloralabs/allora-sdk';
import type { AlloraInference, AlloraTopicsResponse } from './types.js';

/**
 * Wrapper around the Allora API client with SecretVM optimizations
 */
export class AlloraClientWrapper {
  private client: AlloraAPIClient;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(apiKey: string, chainSlug: ChainSlug = ChainSlug.TESTNET) {
    this.client = new AlloraAPIClient({
      chainSlug,
      apiKey,
    });
  }

  /**
   * Fetch all available topics with retry logic
   */
  async getAllTopics(): Promise<AlloraTopicsResponse> {
    return this.withRetry(async () => {
      const topics = await this.client.getAllTopics();
      return topics;
    });
  }

  /**
   * Fetch inference data for a specific topic ID with retry logic
   */
  async getInferenceByTopicID(topicID: number): Promise<AlloraInference> {
    return this.withRetry(async () => {
      const inference = await this.client.getInferenceByTopicID(topicID);
      return inference;
    });
  }

  /**
   * Generic retry wrapper for API calls
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt}/${this.maxRetries} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`All ${this.maxRetries} attempts failed. Last error: ${lastError!.message}`);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check by fetching topics
      await this.client.getAllTopics();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
