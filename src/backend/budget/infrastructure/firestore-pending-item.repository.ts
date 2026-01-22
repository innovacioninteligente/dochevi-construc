import { PendingPriceItem, PendingPriceItemRepository } from "@/backend/budget/domain/pending-price-item";
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

export class FirestorePendingPriceItemRepository implements PendingPriceItemRepository {
    private db;
    private collectionName = 'pending_price_items';

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
    }

    async create(item: PendingPriceItem): Promise<void> {
        await this.db.collection(this.collectionName).doc(item.id).set(item);
    }

    async findAllPending(): Promise<PendingPriceItem[]> {
        const snapshot = await this.db.collection(this.collectionName)
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate() // Convert Timestamp to Date
            } as PendingPriceItem;
        });
    }

    async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
        await this.db.collection(this.collectionName).doc(id).update({ status });
    }
}
