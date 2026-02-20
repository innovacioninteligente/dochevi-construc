
import { MaterialCatalogRepository } from '@/backend/material-catalog/domain/material-catalog-repository';
import { MaterialItem } from '@/backend/material-catalog/domain/material-item';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export class FirestoreMaterialCatalogRepository implements MaterialCatalogRepository {
    private collectionName = 'material_catalog';

    async findById(id: string): Promise<MaterialItem | null> {
        const doc = await getFirestore().collection(this.collectionName).doc(id).get();
        if (!doc.exists) return null;
        return doc.data() as MaterialItem;
    }

    async findBySku(sku: string): Promise<MaterialItem | null> {
        const snapshot = await getFirestore().collection(this.collectionName)
            .where('sku', '==', sku)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as MaterialItem;
    }

    async save(item: MaterialItem): Promise<void> {
        const id = item.id || getFirestore().collection(this.collectionName).doc().id;

        const { embedding, ...rest } = item;

        // Sanitize: Firestore does not accept 'undefined'
        const safeRest = JSON.parse(JSON.stringify(rest));

        const itemToSave: any = { ...safeRest, id, updatedAt: new Date() };

        if (embedding) {
            itemToSave.embedding = FieldValue.vector(embedding);
        }

        await getFirestore().collection(this.collectionName).doc(id).set(itemToSave);
    }

    async saveBatch(items: MaterialItem[]): Promise<void> {
        const db = getFirestore();
        // Increased to 25 (was 10) for better performance now that embeddings are correctly 768 dims
        const chunkSize = 25;

        console.log(`[Repository] Saving total ${items.length} items in chunks of ${chunkSize}...`);

        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            const batch = db.batch();

            for (const item of chunk) {
                const id = item.id || db.collection(this.collectionName).doc().id;
                const ref = db.collection(this.collectionName).doc(id);

                // IMPORTANT: Use FieldValue.vector for embeddings to enable Vector Search
                const { embedding, ...rest } = item;

                // Sanitize: Firestore does not accept 'undefined'
                const safeRest = JSON.parse(JSON.stringify(rest)); // Quickest way to remove undefined from simple objects

                const itemToSave: any = { ...safeRest, id, updatedAt: new Date() };

                if (embedding) {
                    itemToSave.embedding = FieldValue.vector(embedding);
                }

                batch.set(ref, itemToSave);
            }

            try {
                await batch.commit();
            } catch (error) {
                console.error(`[Repository] Error committing chunk ${i / chunkSize + 1}:`, error);

                // Debug log to indentify massive items
                const jsonSize = JSON.stringify(chunk).length;
                console.error(`[Repository] Failed chunk size approx: ${(jsonSize / 1024).toFixed(2)} KB. Items: ${chunk.length}`);

                throw error;
            }
        }
    }
    async saveBatchSafe(items: MaterialItem[]): Promise<void> {
        const db = getFirestore();
        const chunkSize = 400; // Safe limit

        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            const batch = db.batch();

            for (const item of chunk) {
                const id = item.id || db.collection(this.collectionName).doc().id;
                const ref = db.collection(this.collectionName).doc(id);
                batch.set(ref, { ...item, id, updatedAt: new Date() });
            }

            await batch.commit();
        }
    }

    async searchByVector(vector: number[], limit: number): Promise<MaterialItem[]> {
        // Requires Firestore Vector Search Extension enabled on 'embedding' field
        const db = getFirestore();
        const coll = db.collection(this.collectionName);

        try {
            // @ts-ignore: Vector search syntax for node client might vary based on version/extension
            // Standard approach with extension helper or raw query if supported
            // Using logic typically used with the extension (findNearest)

            const vectorQuery = coll.findNearest('embedding', FieldValue.vector(vector), {
                limit: limit,
                distanceMeasure: 'COSINE'
            });

            const snapshot = await vectorQuery.get();
            return snapshot.docs.map(doc => doc.data() as MaterialItem);

        } catch (error) {
            console.error("Vector search failed:", error);
            // Fallback: empty or basic query
            return [];
        }
    }

    async searchByText(query: string, limit: number): Promise<MaterialItem[]> {
        // Simple text search (startswith/equality) or rely on client-side filtering if needed
        // Firestore native text search is limited. 
        // For now, implementing a basic prefix search on Name

        const snapshot = await getFirestore().collection(this.collectionName)
            .where('name', '>=', query)
            .where('name', '<=', query + '\uf8ff')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => doc.data() as MaterialItem);
    }

    async findByPage(page: number, year: number): Promise<MaterialItem[]> {
        const snapshot = await getFirestore().collection(this.collectionName)
            .where('metadata.page', '==', page)
            .where('year', '==', year)
            .limit(1)
            .get();

        return snapshot.docs.map(doc => doc.data() as MaterialItem);
    }

    async deleteByYear(year: number): Promise<number> {
        const db = getFirestore();
        const coll = db.collection(this.collectionName);
        let deletedCount = 0;

        // Batches of 10 to be ultra-safe. Firestore 10MB limit is hardcoded and cannot be increased.
        // Deleting indexed vectors (especially if there are leftover 3072-dim ones) has high overhead.

        while (true) {
            const snapshot = await coll.where('year', '==', year).limit(10).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));

            try {
                await batch.commit();
            } catch (error: any) {
                if (error.message?.includes('Transaction too big')) {
                    console.warn(`[Repository] Batch of 10 too big. Falling back to sequential deletion for this page...`);
                    for (const doc of snapshot.docs) {
                        await doc.ref.delete();
                    }
                } else {
                    throw error;
                }
            }

            deletedCount += snapshot.size;
            console.log(`[Repository] Deleted ${deletedCount} items for year ${year}...`);
        }

        return deletedCount;
    }
    async deleteAll(): Promise<number> {
        const db = getFirestore();
        const coll = db.collection(this.collectionName);
        let deletedCount = 0;

        console.log(`[Repository] Deleting ALL items from ${this.collectionName}...`);

        while (true) {
            const snapshot = await coll.limit(50).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            deletedCount += snapshot.size;
            console.log(`[Repository] Deleted ${deletedCount} items...`);
        }
        return deletedCount;
    }
}
