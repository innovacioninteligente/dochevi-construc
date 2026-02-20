// src/backend/expense/infrastructure/firestore-provider-repository.ts
import { Provider, ProviderRepository } from '../domain/provider';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

/**
 * Firestore implementation of the ProviderRepository.
 */
export class FirestoreProviderRepository implements ProviderRepository {
    private db;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    private get collection() {
        return this.db.collection('providers');
    }

    async findById(id: string): Promise<Provider | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return this.mapDocToProvider(doc);
    }

    async findByCif(cif: string): Promise<Provider | null> {
        const snapshot = await this.collection
            .where('cif', '==', cif)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        return this.mapDocToProvider(snapshot.docs[0]);
    }

    async findAll(): Promise<Provider[]> {
        const snapshot = await this.collection.orderBy('name', 'asc').get();
        return snapshot.docs.map(doc => this.mapDocToProvider(doc));
    }

    async save(provider: Provider): Promise<void> {
        console.log(`[Infrastructure] Saving provider to Firestore: ${provider.id}`);
        await this.collection.doc(provider.id).set(
            { ...provider },
            { merge: true }
        );
    }

    private mapDocToProvider(doc: FirebaseFirestore.DocumentSnapshot): Provider {
        const data = doc.data()!;
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt) ?? new Date(),
        } as Provider;
    }
}
