

import { PriceBookRepository } from '../domain/price-book-repository';
import { RegexPriceBookParser } from '../infrastructure/regex-price-book-parser';
import { IngestionJobRepository } from '../domain/ingestion-job-repository';
import { ai, embeddingModel } from '@/backend/ai/config/genkit.config';
import { PriceBookItem } from '../domain/price-book-item';

/**
 * Application Service / Use Case: Ingest Price Book (Async Job)
 */
export class IngestPriceBookService {
    constructor(
        private repository: PriceBookRepository,
        private parser: RegexPriceBookParser,
        private jobRepository: IngestionJobRepository
    ) { }

    async execute(fileUrl: string, year: number, jobId: string) {
        console.log(`[Job ${jobId}] Starting ingestion for year ${year}...`);

        try {
            // 1. Update Job Status to Processing
            await this.jobRepository.update(jobId, { status: 'processing', progress: 10, logs: ['Job Initiated.'] });

            const logs: string[] = ['Job Initiated.'];
            const onLog = async (msg: string) => {
                logs.push(msg);
                await this.jobRepository.update(jobId, { logs });
            };

            // 2. Parse PDF
            const items = await this.parser.parsePdf(fileUrl, year,
                async (p) => { await this.jobRepository.update(jobId, { progress: Math.min(40, p) }) }, // Cap parser progress at 40%
                onLog
            );

            await this.jobRepository.update(jobId, { progress: 40 });

            if (items.length === 0) {
                throw new Error("No items extracted from PDF.");
            }

            await onLog(`[Job ${jobId}] Extracted ${items.length} items. Generating Embeddings...`);

            // 3. Generate Embeddings (Enrichment)
            const enrichedItems = await this.enrichWithEmbeddings(items, async (p) => {
                // Map enrichment progress (0-100) to Job progress (40-80)
                const jobProgress = 40 + Math.round(p * 0.4);
                await this.jobRepository.update(jobId, { progress: jobProgress });
            });

            await onLog(`[Job ${jobId}] Embeddings generated. Saving to database...`);

            // 4. Save items (Progress 80-100)
            await this.jobRepository.update(jobId, { progress: 80 });
            await this.repository.saveBatch(enrichedItems);

            // 5. Update Job Status to Completed
            await this.jobRepository.update(jobId, {
                status: 'completed',
                progress: 100,
                logs: [...logs, 'Completed successfully.', `Imported ${items.length} items with embeddings.`],
                totalItems: items.length
            });

            console.log(`[Job ${jobId}] Completed successfully.`);
            return { count: items.length };

        } catch (error: any) {
            console.error(`[Job ${jobId}] Failed:`, error);
            await this.jobRepository.update(jobId, {
                status: 'failed',
                error: error.message || 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Generates vector embeddings for a list of items using Genkit.
     * Uses batch processing to respect API limits and optimize performance.
     */
    private async enrichWithEmbeddings(
        items: PriceBookItem[],
        onProgress: (percent: number) => Promise<void>
    ): Promise<PriceBookItem[]> {
        const batchSize = 100;
        const total = items.length;
        let processed = 0;
        const enrichedItems: PriceBookItem[] = [];

        // Prepare batches
        for (let i = 0; i < total; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            // Context for embedding: "Code: Description Unit"
            // We embed a rich string representation to improve semantic match
            const textsToEmbed = batch.map(item => `${item.code}: ${item.description} (${item.unit})`);

            try {
                // Call Genkit embedMany
                const embeddings = await ai.embedMany({
                    embedder: embeddingModel,
                    content: textsToEmbed,
                });

                // Assign embeddings back to items
                for (let j = 0; j < batch.length; j++) {
                    batch[j].embedding = embeddings[j].embedding;
                }

                enrichedItems.push(...batch);

            } catch (error) {
                console.error(`Error embedding batch ${i}-${i + batchSize}:`, error);
                // Fallback: Push items without embedding so we don't lose data, but log error
                // In production, might want to retry.
                enrichedItems.push(...batch);
            }

            processed += batch.length;
            const percent = Math.round((processed / total) * 100);
            await onProgress(percent);

            // Console log progress to avoid timeouts appearing silent
            console.log(`[EmbedService] Processed ${processed}/${total} items.`);
        }

        return enrichedItems;
    }
}
