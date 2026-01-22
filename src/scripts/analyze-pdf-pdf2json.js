
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser(this, 1); // 1 = Text content only

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    // pdfData is the raw JSON. Let's extract clean text to see the structure.
    // pdf2json returns a "formImage" with "Pages", each having "Texts".

    // We want to simulate line-by-line reading.
    // We can look at Page 50 (arbitrary middle page).
    const pageIndex = 50;
    const page = pdfData.formImage.Pages[pageIndex];

    if (!page) {
        console.log("Page 50 not found.");
        return;
    }

    console.log(`--- Analyzing Page ${pageIndex + 1} ---`);

    // Simple extraction: Join texts that are on the same Y coordinate (line)
    // Map: Y -> Array of texts
    const lines = new Map();

    page.Texts.forEach(t => {
        const y = Math.round(t.y * 100) / 100; // Round to avoid float precision issues
        const text = decodeURIComponent(t.R[0].T);

        if (!lines.has(y)) lines.set(y, []);
        lines.get(y).push(text);
    });

    // Sort by Y
    const sortedY = Array.from(lines.keys()).sort((a, b) => a - b);

    sortedY.forEach(y => {
        const lineText = lines.get(y).join(" "); // Naive join
        console.log(`[Y=${y}] ${lineText}`);
    });

    // Search for specific codes in the whole doc
    console.log("\n--- SEARCHING FOR TARGETS ---");
    const fullText = pdfParser.getRawTextContent();
    const targets = ["D1902.0080", "IED010", "FB010", "XFB010", "EHU010", "990320647"];

    targets.forEach(t => {
        if (fullText.includes(t)) {
            console.log(`FOUND '${t}' in raw text dump.`);
        } else {
            console.log(`Code '${t}' NOT found in raw text dump.`);
        }
    });
});

const filePath = path.resolve('public/documents/Libro Precios 46_COAATMCA.pdf');
console.log(`Loading PDF: ${filePath}`);
pdfParser.loadPDF(filePath);
