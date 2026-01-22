const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function run() {
    const pdfPath = path.join(process.cwd(), 'public', 'documents', 'libro_precios_2024.pdf');
    console.log(`Reading PDF from: ${pdfPath}`);

    try {
        const buffer = fs.readFileSync(pdfPath);
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();

        console.log('--- RAW TEXT START ---');
        // Print first 5000 characters to see the structure
        console.log(data.text.substring(0, 5000));
        console.log('--- RAW TEXT END ---');

        // Also print a line-by-line analysis for the first 50 lines that look like items
        const lines = data.text.split(/\r\n|\n|\r/);
        console.log('\n--- LINE ANALYSIS ---');
        lines.slice(0, 100).forEach((line, i) => {
            if (line.trim().length > 0) {
                console.log(`[${i}] ${JSON.stringify(line)}`);
            }
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
