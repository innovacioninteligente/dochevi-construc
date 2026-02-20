
export interface IngestionLog {
    timestamp: number;
    message: string;
    level: 'info' | 'error' | 'success' | 'warning';
}

export interface IngestionStatus {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalPages: number;
    processedPages: number;
    totalItems: number;
    logs: IngestionLog[];
    currentActivity?: string; // e.g., "Processing page 5/10", "Generating embeddings..."
    error?: string;
    usage?: {
        extractionTokens: number;
        embeddingTokens: number;
        totalTokens: number;
    };
    createdAt: number; // Timestamp
    updatedAt: number;
}
