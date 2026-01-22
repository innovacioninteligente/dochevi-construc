
export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IngestionJob {
    id: string;
    fileName: string;
    fileUrl: string;
    status: IngestionStatus;
    progress: number; // 0-100
    year?: number;
    error?: string;
    logs?: string[];
    totalItems?: number;
    createdAt: Date;
    updatedAt: Date;
}
