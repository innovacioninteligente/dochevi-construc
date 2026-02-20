
import * as dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { genkit } from 'genkit';
import { googleAI, geminiEmbedding001 } from '@genkit-ai/googleai';

// Initialize Env
dotenv.config({ path: '.env' });

// Initialize Firebase
import { initFirebaseAdminApp } from '../src/backend/shared/infrastructure/firebase/admin-app';
// Ensure env is loaded before init if needed, though initFirebaseAdminApp reads process.env
initFirebaseAdminApp();

const db = getFirestore();

// Initialize AI
const ai = genkit({
    plugins: [googleAI()],
});

const embeddingModel = geminiEmbedding001;

async function repairVectors() {
    console.log('--- Starting Catalog Vector Repair ---');
    console.time('Repair Duration');

    const year = 2025;
    const batchSize = 50;
    let fixedCount = 0;
    let errorCount = 0;

    // 1. Fetch all items for the year
    console.log(`Fetching catalog items for year ${year}...`);
    const snapshot = await db.collection('material_catalog')
        .where('year', '==', year)
        .get();

    if (snapshot.empty) {
        console.log('No items found.');
        return;
    }

    console.log(`Found ${snapshot.size} items. Scanning for missing embeddings...`);

    const itemsToRepair: any[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        // Check for missing embedding or wrong dimension (if we were strictly checking 768)
        if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
            itemsToRepair.push({ id: doc.id, ...data });
        }
    });

    console.log(`Found ${itemsToRepair.length} items requiring repair.`);

    // 2. Process in batches
    for (let i = 0; i < itemsToRepair.length; i += batchSize) {
        const batchItems = itemsToRepair.slice(i, i + batchSize);
        console.log(`Processing batch ${i + 1} to ${i + batchItems.length}...`);

        const textsToEmbed = batchItems.map(item =>
            `${item.category} : ${item.name} - ${item.description} (${item.unit})`
        );

        try {
            // Generate Embeddings
            const results = await ai.embedMany({
                embedder: embeddingModel,
                content: textsToEmbed,
                options: { outputDimensionality: 768 }
            });

            // Update Firestore
            const writeBatch = db.batch();
            batchItems.forEach((item, index) => {
                const ref = db.collection('material_catalog').doc(item.id);
                writeBatch.update(ref, {
                    embedding: results[index].embedding,
                    updatedAt: new Date()
                });
            });

            await writeBatch.commit();
            fixedCount += batchItems.length;
            console.log(`✅ Fixed ${batchItems.length} items.`);

        } catch (error) {
            console.error(`❌ Error repairing batch starting at index ${i}:`, error);
            errorCount += batchItems.length;
        }
    }

    console.log('--- Repair Finished ---');
    console.log(`Total Fixed: ${fixedCount}`);
    console.log(`Total Errors: ${errorCount}`);
    console.timeEnd('Repair Duration');
}

repairVectors().catch(console.error);
