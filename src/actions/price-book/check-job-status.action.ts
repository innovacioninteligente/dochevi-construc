
'use server';

import { FirestoreIngestionJobRepository } from '@/backend/price-book/infrastructure/firestore-ingestion-job-repository';

export async function checkIngestionJobStatus(jobId: string) {
    const jobRepo = new FirestoreIngestionJobRepository();
    const job = await jobRepo.findById(jobId);

    if (!job) {
        return { success: false, error: 'Job not found' };
    }

    return {
        success: true,
        job: {
            ...job,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
        }
    };
}
