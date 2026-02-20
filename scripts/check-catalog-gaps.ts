
import * as dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Env
dotenv.config({ path: '.env' });

// Initialize Firebase
import { initFirebaseAdminApp } from '../src/backend/shared/infrastructure/firebase/admin-app';
initFirebaseAdminApp();

const db = getFirestore();

async function checkGaps() {
    console.log('--- Starting Page Gap Analysis ---');

    const year = 2025;
    // We assume the catalog has around 524 pages as per previous logs
    const maxPage = 524;

    console.log(`Fetching metadata for year ${year}...`);
    // Usage of collection group might be needed if structure was subcollection, 
    // but here it is root collection with metadata.page
    const snapshot = await db.collection('material_catalog')
        .where('year', '==', year)
        .select('metadata.page') // Only fetch page field
        .get();

    const pagesFound = new Set<number>();
    snapshot.forEach(doc => {
        const p = doc.data().metadata?.page;
        if (p) pagesFound.add(p);
    });

    console.log(`Found items from ${pagesFound.size} unique pages.`);

    const missingPages: number[] = [];
    // We only check up to the max detected page or the known limit if provided.
    // Let's find the max page actually processed to set a reasonable range if 524 wasn't reached.
    const maxDetected = Math.max(...Array.from(pagesFound));
    console.log(`Max page detected in DB: ${maxDetected}`);

    const limitToCheck = maxDetected > 0 ? maxDetected : maxPage;

    for (let i = 1; i <= limitToCheck; i++) {
        if (!pagesFound.has(i)) {
            missingPages.push(i);
        }
    }

    if (missingPages.length > 0) {
        console.log('⚠️  MISSING PAGES DETECTED:');
        console.log(JSON.stringify(missingPages, null, 2));
        console.log(`Total missing: ${missingPages.length}`);
    } else {
        console.log('✅ No gaps detected in the processed range.');
    }

    console.log('--- Gap Analysis Finished ---');
}

checkGaps().catch(console.error);
