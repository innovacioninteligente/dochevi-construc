
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { IngestMaterialCatalogService } from '../src/backend/material-catalog/application/ingest-catalog-service';
import { FirestoreMaterialCatalogRepository } from '../src/backend/material-catalog/infrastructure/firestore-material-catalog-repository';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { PDFDocument } from 'pdf-lib';

dotenv.config();

// Init Admin
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
        console.log('Firebase initialized with Service Account');
    } else {
        initializeApp({ projectId });
        console.log('Firebase initialized with ADC');
    }
}

async function runTest() {
    const pdfPath = 'public/documents/Catálogo 2025 - Catalogo Imprenta Almacenes_20_Barcelona_2025.pdf';
    console.log(`Loading PDF from: ${pdfPath}`);

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF not found at ${pdfPath}`);
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDocRaw = await PDFDocument.load(pdfBuffer);

    // Create a new PDF with specific pages (where products are likely to be found)
    const subPdf = await PDFDocument.create();
    const pagesToCopy = [10, 11, 12, 13, 14];
    const copiedPages = await subPdf.copyPages(pdfDocRaw, pagesToCopy);
    copiedPages.forEach(p => subPdf.addPage(p));

    const pdfBase64 = await subPdf.saveAsBase64();
    console.log(`Sub-PDF created (5 pages). Base64 length: ${pdfBase64.length}`);

    const repository = new FirestoreMaterialCatalogRepository();
    const service = new IngestMaterialCatalogService(repository);

    const jobId = `test_script_${Date.now()}`;
    console.log(`--- Starting target ingestion for Job: ${jobId} ---`);

    // Intercept and verify dimensions if possible, or just let service run and we check logs
    // I will add a log inside IngestMaterialCatalogService too, but let's update script to verify.

    try {
        await service.execute(pdfBase64, {
            year: 2025,
            source: 'test_script',
            concurrency: 2
        }, jobId);

        // Verify results in Firestore
        const db = getFirestore();
        const snapshot = await db.collection('material_catalog')
            .where('metadata.catalogSource', '==', 'test_script')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const firstItem = snapshot.docs[0].data();
            const dims = firstItem.embedding?.length || 0;
            console.log(`[VERIFY] Found item with ${dims} dimensions.`);
            if (dims === 768) {
                console.log('✅ SUCCESS: Dimensions are correctly set to 768.');
            } else {
                console.log(`❌ FAILURE: Dimensions are ${dims}, expected 768.`);
            }
        } else {
            console.log('⚠️ No items found to verify.');
        }

        console.log('--- Ingestion finished ---');
    } catch (error) {
        console.error('--- Ingestion failed ---', error);
    }
}

runTest().catch(console.error);
