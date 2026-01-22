'use server';

import { FirestorePriceBookRepository } from '@/backend/price-book/infrastructure/firestore-price-book-repository';
import { FirestoreIngestionJobRepository } from '@/backend/price-book/infrastructure/firestore-ingestion-job-repository';
import { RegexPriceBookParser } from '@/backend/price-book/infrastructure/regex-price-book-parser';
import { IngestPriceBookService } from '@/backend/price-book/application/ingest-price-book-service';
import { IngestionJob } from '@/backend/price-book/domain/ingestion-job';
// import { v4 as uuidv4 } from 'uuid'; // Removed in favor of crypto.randomUUID()

export async function ingestPriceBookAction(fileUrl: string, fileName: string, year: number) {
    console.log("Action: Ingest Price Book (Async Trigger)", fileName, year);

    const jobId = crypto.randomUUID();
    // const year = new Date().getFullYear(); // Removed hardcoded default

    // Initialize Dependencies (Hexagonal)
    // Infrastructure
    const parser = new RegexPriceBookParser(); // Use Rule-based parser
    const repository = new FirestorePriceBookRepository();
    const jobRepository = new FirestoreIngestionJobRepository();

    // Application Service
    const service = new IngestPriceBookService(repository, parser, jobRepository);

    // 1. Create Initial Job Record
    const newJob: IngestionJob = {
        id: jobId,
        fileName,
        fileUrl,
        status: 'pending',
        progress: 0,
        year: year,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        await jobRepository.create(newJob);

        // 2. Trigger Background Processing (Fire and Forget-ish)
        // In Next.js serverless, we must NOT await this if we want to return immediately.
        // However, Vercel might kill the process.
        // Ideally use `void service.execute(...)` but we need to ensure the runtime keeps it alive.

        // Attempting "no-await" pattern for local dev (User request).
        // In production, this needs 'waitUntil' or 'experimental_after'.

        // We will wrap this in a setTimeout to decouple the stack slightly and let the response return.
        // Note: This is fragile in Serverless but works in 'npm run dev' long-running node process.

        (async () => {
            try {
                await service.execute(fileUrl, year, jobId);
            } catch (e) {
                console.error("Background processing failed", e);
                // Job status is updated to 'failed' inside service catch block
            }
        })();

        return { success: true, jobId: jobId };

    } catch (error: any) {
        console.error("Action Error:", error);
        return { success: false, error: error.message || 'Failed to start job' };
    }
}
