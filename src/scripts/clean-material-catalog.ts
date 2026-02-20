
import 'dotenv/config';
import { FirestoreMaterialCatalogRepository } from '@/backend/material-catalog/infrastructure/firestore-material-catalog-repository';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        console.log('[Clean] Initializing Firebase with Service Account...');
        initializeApp({ credential: cert(serviceAccount) });
    } else {
        console.log('[Clean] Initializing Firebase with default credentials...');
        initializeApp();
    }
}

async function main() {
    const repository = new FirestoreMaterialCatalogRepository();
    console.log('[Clean] Starting cleanup of material_catalog...');

    try {
        const count = await repository.deleteAll();
        console.log(`[Clean] Successfully deleted ${count} items.`);
    } catch (error) {
        console.error('[Clean] Error during cleanup:', error);
    }
}

main().catch(console.error);
