'use server';

import { processPriceBookPdf } from '@/genkit/ingestion';

export async function ingestPriceBook(fileUrl: string, fileName: string) {
    console.log("Starting Ingestion for: ", fileName);

    try {
        const result = await processPriceBookPdf(fileUrl, new Date().getFullYear());
        return { success: true, count: result.count };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to process PDF' };
    }
}
