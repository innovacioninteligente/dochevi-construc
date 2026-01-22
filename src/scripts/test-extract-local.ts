
import 'dotenv/config';
import { GeminiPriceBookParser } from '../backend/price-book/infrastructure/gemini-price-book-parser';
import path from 'path';

async function main() {
    const parser = new GeminiPriceBookParser();
    const filePath = path.resolve('public/documents/Libro Precios 46_COAATMCA.pdf');

    console.log(`Testing extraction on: ${filePath}`);

    // Create a temp pdf with pages 50-55 to test actual content
    const { PDFDocument } = require('pdf-lib');
    const fs = require('fs');

    const srcBuffer = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(srcBuffer);
    const subDoc = await PDFDocument.create();

    // Pages 50-55 (0-based indices 49-54)
    const indices = [49, 50, 51, 52, 53, 54];
    const copiedPages = await subDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((page: any) => subDoc.addPage(page));

    const tempPath = path.resolve('public/documents/temp_test_chunk.pdf');
    const pdfBytes = await subDoc.save();
    fs.writeFileSync(tempPath, pdfBytes);

    console.log(`Created temp chunk at ${tempPath} with ${indices.length} pages.`);

    try {
        const items = await parser.parsePdf(tempPath, 2026, async (percent) => {
            console.log(`Progress: ${percent}%`);
        });

        console.log("Extraction Results Sample:");
        console.log(JSON.stringify(items.slice(0, 3), null, 2));

    } catch (e: any) {
        if (e.message === "TEST_COMPLETE") {
            console.log("Test finished successfully (partial). Check logs above for extracted items.");
        } else {
            console.error("Test failed:", e);
        }
    }
}

main();
