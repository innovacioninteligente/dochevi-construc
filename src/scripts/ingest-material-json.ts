// Load environment variables immediately
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from current working directory
const result = dotenv.config({ path: path.join(process.cwd(), '.env') });

if (result.error) {
    console.error('[Ingest] Error loading .env file:', result.error);
}

console.log('[Ingest] Environment loaded.');
console.log(`[Ingest] GOOGLE_GENAI_API_KEY present: ${!!process.env.GOOGLE_GENAI_API_KEY}`);
console.log(`[Ingest] GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);

import fs from 'fs';
import { z } from 'zod';
import { MaterialItem } from '@/backend/material-catalog/domain/material-item';
import { FirestoreMaterialCatalogRepository } from '@/backend/material-catalog/infrastructure/firestore-material-catalog-repository';
import { ai, embeddingModel } from '@/backend/ai/config/genkit.config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        console.log('[Ingest] Initializing Firebase with Service Account credentials...');
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.log('[Ingest] Initializing Firebase with default credentials (likely failing if not on GCP)...');
        initializeApp();
    }
}

const RawMaterialSchema = z.object({
    producto: z.string(),
    precio: z.number(),
    unidad: z.string(),
    categoria: z.string(),
    descripcion: z.string().optional(),
    referencia: z.string(),
    subcategoria: z.string().optional(),
    variante: z.string().optional(),
    marca: z.string().optional(),
    pagina: z.number().optional()
});

type RawMaterial = z.infer<typeof RawMaterialSchema>;

const BATCH_SIZE = 50; // Genkit batch limit safe zone

async function main() {
    const jsonPath = path.join(process.cwd(), 'prices', 'catalog_materias.json');
    console.log(`[Ingest] Reading JSON from ${jsonPath}...`);

    if (!fs.existsSync(jsonPath)) {
        console.error(`[Ingest] File not found: ${jsonPath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const rawItems: RawMaterial[] = JSON.parse(rawData);

    console.log(`[Ingest] Found ${rawItems.length} items to ingest.`);

    const repository = new FirestoreMaterialCatalogRepository();

    // 0. Clean Collection
    console.log('[Ingest] Cleaning existing material_catalog collection...');
    await repository.deleteAll();
    console.log('[Ingest] Collection cleaned.');

    const totalItems = rawItems.length;
    let processedCount = 0;

    // We will process in chunks
    for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const chunk = rawItems.slice(i, i + BATCH_SIZE);
        console.log(`[Ingest] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalItems / BATCH_SIZE)} (${chunk.length} items)...`);

        // 1. Map to Domain
        const domainItems: MaterialItem[] = chunk.map(raw => {
            const descriptionParts = [
                raw.descripcion,
                raw.variante ? `Variante: ${raw.variante}` : null,
                raw.marca ? `Marca: ${raw.marca}` : null
            ].filter(Boolean).join('. ');

            const categoryPath = [raw.categoria, raw.subcategoria].filter(Boolean).join(' > ');

            return {
                // sku is unique identifier
                sku: raw.referencia,
                name: raw.producto,
                description: descriptionParts || raw.producto, // Fallback if no desc
                category: categoryPath,
                price: raw.precio,
                unit: raw.unidad,
                year: 2025, // Assuming current catalog year
                metadata: {
                    page: raw.pagina || 0,
                    catalogSource: 'Obramat JSON 2025',
                    year: 2025,
                    rawText: JSON.stringify(raw)
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        // 2. Generate Embeddings
        try {
            const textsToEmbed = domainItems.map(item =>
                `${item.category} : ${item.name} - ${item.description} (${item.unit})`
            );

            // Using Genkit embedMany
            const embeddings = await ai.embedMany({
                embedder: embeddingModel,
                content: textsToEmbed,
                options: { outputDimensionality: 768 }
            });



            // Verify dimensions of the first embedding in the batch
            if (embeddings.length > 0 && embeddings[0].embedding.length !== 768) {
                console.warn(`[Ingest] WARNING: Embedding dimension is ${embeddings[0].embedding.length}, expected 768!`);
            }

            // Attach embeddings
            const enrichedItems = domainItems.map((item, idx) => ({
                ...item,
                embedding: embeddings[idx].embedding
            }));

            // 3. Save to Firestore
            await repository.saveBatch(enrichedItems);

            processedCount += chunk.length;
            console.log(`[Ingest] Saved ${processedCount}/${totalItems} items.`);
        } catch (error) {
            console.error(`[Ingest] Error processing batch starting at index ${i}:`, error);
            // Verify if it's a quote exceeded error, wait and retry?
            // For now, log and continue (or exit depending on severity)
        }
    }

    console.log('[Ingest] Done!');
}

main().catch(console.error);
