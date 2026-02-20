// src/backend/project/infrastructure/firestore-project-repository.ts
import { Project, ProjectRepository } from '../domain/project';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

/**
 * Firestore implementation of the ProjectRepository.
 */
export class FirestoreProjectRepository implements ProjectRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    private get collection() {
        return this.db.collection('projects');
    }

    async findById(id: string): Promise<Project | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return this.mapDocToProject(doc);
    }

    async findByBudgetId(budgetId: string): Promise<Project | null> {
        const snapshot = await this.collection
            .where('budgetId', '==', budgetId)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        return this.mapDocToProject(snapshot.docs[0]);
    }

    async findAll(): Promise<Project[]> {
        const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => this.mapDocToProject(doc));
    }

    async save(project: Project): Promise<void> {
        console.log(`[Infrastructure] Saving project to Firestore: ${project.id}`);
        const dataToSave = this.stripUndefined({
            ...project,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt || new Date(),
        });

        await this.collection.doc(project.id).set(dataToSave, { merge: true });
    }

    private stripUndefined(obj: any): any {
        if (obj instanceof Date) return obj;
        if (Array.isArray(obj)) return obj.map(v => this.stripUndefined(v));
        if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, this.stripUndefined(v)])
            );
        }
        return obj;
    }

    async delete(id: string): Promise<void> {
        console.log(`[Infrastructure] Deleting project from Firestore: ${id}`);
        await this.collection.doc(id).delete();
    }

    private mapDocToProject(doc: FirebaseFirestore.DocumentSnapshot): Project {
        const data = doc.data()!;

        // Map phase dates
        const phases = (data.phases || []).map((p: any) => ({
            ...p,
            estimatedStartDate: p.estimatedStartDate?.toDate?.() ?? (p.estimatedStartDate ? new Date(p.estimatedStartDate) : undefined),
            estimatedEndDate: p.estimatedEndDate?.toDate?.() ?? (p.estimatedEndDate ? new Date(p.estimatedEndDate) : undefined),
            actualStartDate: p.actualStartDate?.toDate?.() ?? (p.actualStartDate ? new Date(p.actualStartDate) : undefined),
            actualEndDate: p.actualEndDate?.toDate?.() ?? (p.actualEndDate ? new Date(p.actualEndDate) : undefined),
        }));

        return {
            ...data,
            id: doc.id,
            phases,
            team: data.team || [],
            startDate: data.startDate?.toDate?.() ?? (data.startDate ? new Date(data.startDate) : undefined),
            estimatedEndDate: data.estimatedEndDate?.toDate?.() ?? (data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined),
            actualEndDate: data.actualEndDate?.toDate?.() ?? (data.actualEndDate ? new Date(data.actualEndDate) : undefined),
            createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt) ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt) ?? new Date(),
        } as Project;
    }
}
