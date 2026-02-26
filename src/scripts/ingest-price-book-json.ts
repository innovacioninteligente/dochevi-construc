
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PriceBookItem } from '../backend/price-book/domain/price-book-item';

// Load environment variables
dotenv.config({ path: '.env' });

// Initialize Firebase Admin (Matching project standard)
const adminConfig = {
    projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
    credential: (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
        ? cert({
            projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
        : undefined // Fallback to ADC
};

if (!getApps().length) {
    initializeApp(adminConfig);
}

const db = getFirestore();

async function ingestPriceBook() {
    const jsonPath = path.join(process.cwd(), 'prices', 'precios_2024_hybrid_full.json');
    console.log(`Reading JSON from: ${jsonPath}`);

    try {
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(rawData);

        console.log(`Source: ${data.source}`);
        console.log(`Total Items in JSON: ${data.itemCount}`);

        const items = data.items;
        const totalItems = items.length;
        const batchSize = 50; // Lowered from 400 to avoid "Transaction too big" with complex breakdowns
        let processedCount = 0;

        // Process in chunks
        for (let i = 0; i < totalItems; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const batch = db.batch();

            chunk.forEach((item: any) => {
                // Sanitize ID
                const docId = `2024_${item.code.replace(/\./g, '_')}`;
                const docRef = db.collection('price_book_items').doc(docId);

                // Construct payload matching PriceBookItem interface
                // Ensure number fields are numbers
                const payload: PriceBookItem = {
                    code: item.code,
                    description: item.description,
                    unit: item.unit,
                    priceTotal: Number(item.priceTotal),
                    // Optional fields
                    priceLabor: item.priceLabor ? Number(item.priceLabor) : 0,
                    priceMaterial: item.priceMaterial ? Number(item.priceMaterial) : 0,
                    year: 2024,
                    chapter: item.chapter,
                    section: item.section,
                    page: Number(item.page),
                    breakdown: item.breakdown || [],
                    createdAt: new Date(),
                    // We will add basic search keywords for now
                    searchKeywords: [
                        item.code.toLowerCase(),
                        ...item.description.toLowerCase().split(' ').filter((w: string) => w.length > 3)
                    ]
                };

                // Remove undefineds
                const cleanPayload = JSON.parse(JSON.stringify(payload));

                batch.set(docRef, cleanPayload);
            });

            await batch.commit();
            processedCount += chunk.length;
            process.stdout.write(`\rProgress: ${processedCount}/${totalItems} items ingested...`);
        }

        console.log('\n✅ Ingestion Complete!');

    } catch (error) {
        console.error("Error ingesting price book:", error);
    }
}

ingestPriceBook();
