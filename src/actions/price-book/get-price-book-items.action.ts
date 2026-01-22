
'use server';

import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { getFirestore } from 'firebase-admin/firestore';

export async function getPriceBookItems(year: number, limitCount: number = 50) {
    try {
        initFirebaseAdminApp();
        const db = getFirestore();
        const collectionRef = db.collection('price_book_items');

        // Query by year
        const snapshot = await collectionRef
            .where('year', '==', year)
            .limit(limitCount)
            .get();

        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                embedding: undefined, // Explicitly remove embedding to avoid serialization error
                // Convert Firestore Timestamp to Date/ISO String to pass to Client Components
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
            };
        });

        // Get total count (approximation)
        // Note: Count queries can be expensive/slow in Firestore, maybe skip for now or use count aggregate
        const countQuery = collectionRef.where('year', '==', year).count();
        const countSnapshot = await countQuery.get();

        return {
            success: true,
            items,
            total: countSnapshot.data().count
        };
    } catch (error: any) {
        console.error("Error fetching price book items:", error);
        return { success: false, error: error.message };
    }
}
