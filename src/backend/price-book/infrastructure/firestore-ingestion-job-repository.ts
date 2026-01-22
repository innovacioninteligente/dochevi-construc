
import { IngestionJob } from '../domain/ingestion-job';
import { IngestionJobRepository } from '../domain/ingestion-job-repository';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestoreIngestionJobRepository implements IngestionJobRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    async create(job: IngestionJob): Promise<void> {
        await this.db.collection('ingestion_jobs').doc(job.id).set({
            ...job,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        });
    }

    async update(id: string, updates: Partial<IngestionJob>): Promise<void> {
        await this.db.collection('ingestion_jobs').doc(id).update({
            ...updates,
            updatedAt: new Date()
        });
    }

    async findById(id: string): Promise<IngestionJob | null> {
        const doc = await this.db.collection('ingestion_jobs').doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data();

        // Manual mapping to ensure Dates are Date objects (not Timestamps)
        return {
            ...data,
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(data?.createdAt),
            updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data?.updatedAt),
        } as IngestionJob;
    }
}
