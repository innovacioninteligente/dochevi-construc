import dotenv from 'dotenv';
import path from 'path';

// Load env before imports
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { FirestoreMaterialCatalogRepository } from '@/backend/material-catalog/infrastructure/firestore-material-catalog-repository';
import { SearchMaterialService } from '@/backend/material-catalog/application/search-material-service';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Init Firebase
if (getApps().length === 0) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    initializeApp({ credential: cert(serviceAccount) });
}

async function test() {
    const query = process.argv[2] || "cemento";
    console.log(`Testing search for: '${query}'`);

    const repo = new FirestoreMaterialCatalogRepository();
    const service = new SearchMaterialService(repo);

    try {
        console.time("Search");
        const results = await service.search(query, 5);
        console.timeEnd("Search");

        console.log(`Found ${results.length} results.`);
        results.forEach(r => console.log(`- [${r.sku}] ${r.name} (${r.price}€)`));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
