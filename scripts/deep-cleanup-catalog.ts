
import * as dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load .env
dotenv.config();

function initAdmin() {
    if (getApps().length === 0) {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (clientEmail && privateKey) {
            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('Firebase Admin initialized with Service Account');
        } else {
            initializeApp({ projectId });
            console.log('Firebase Admin initialized with Application Default Credentials');
        }
    }
}

async function runCleanup() {
    initAdmin();
    const db = getFirestore();
    const collectionName = 'material_catalog';
    const yearToDelete = 2025;
    let totalDeleted = 0;

    console.log(`Starting DEEP cleanup for catalog year: ${yearToDelete}...`);

    // 1. Delete items with top-level year
    // 2. Delete items with metadata.year
    // We'll use a single loop checking for both or two separate loops.
    // Given Firestore query limitations, we'll do two separate loops for simplicity and reliability.

    const queries = [
        db.collection(collectionName).where('year', '==', yearToDelete),
        db.collection(collectionName).where('metadata.year', '==', yearToDelete),
        db.collection(collectionName).where('metadata.catalogSource', '==', 'test_script')
    ];

    for (const query of queries) {
        while (true) {
            const snapshot = await query.limit(10).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));

            try {
                await batch.commit();
                totalDeleted += snapshot.size;
                console.log(`Deleted ${totalDeleted} items so far...`);
            } catch (error: any) {
                if (error.message?.includes('Transaction too big')) {
                    console.warn(`Batch too big, deleting sequentially...`);
                    for (const doc of snapshot.docs) {
                        try {
                            await doc.ref.delete();
                            totalDeleted++;
                        } catch (e) {
                            console.error(`Error deleting doc ${doc.id}:`, e);
                        }
                    }
                } else {
                    console.error('Batch commit error:', error);
                    break;
                }
            }
        }
    }

    console.log(`Cleanup finished. Total items removed: ${totalDeleted}`);
}

runCleanup().catch(err => {
    console.error('Cleanup script failed:', err);
    process.exit(1);
});
