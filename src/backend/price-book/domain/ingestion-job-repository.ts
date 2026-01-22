
import { IngestionJob } from './ingestion-job';

export interface IngestionJobRepository {
    create(job: IngestionJob): Promise<void>;
    update(id: string, updates: Partial<IngestionJob>): Promise<void>;
    findById(id: string): Promise<IngestionJob | null>;
}
