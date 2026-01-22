const fs = require('fs');
const path = require('path');
// @ts-ignore
const pdf = require('c:/Users/Usuario/Documents/github/works/dochevi/dochevi-construc/node_modules/pdf-parse/dist/node/cjs/index.cjs');

async function main() {
    const filePath = path.resolve('public/documents/Libro Precios 46_COAATMCA.pdf');
    console.log(`Analyzing PDF: ${filePath}`);

    try {
        const dataBuffer = fs.readFileSync(filePath);
        // Handle ESM/CJS interop
        if (typeof pdf !== 'function' && pdf.default) {
            pdf = pdf.default;
        }

        // Check again
        if (typeof pdf !== 'function') {
            console.error('pdf-parse is strictly not a function. Keys:', Object.keys(pdf));
            return;
        }

        const data = await pdf(dataBuffer);

        console.log("PDF Pages:", data.numpages);
        console.log("PDF Info:", data.info);

        // Dump a snippet from the middle
        const center = Math.floor(data.text.length / 2);
        const snippet = data.text.substring(center, center + 5000);

        console.log("\n--- SNIPPET ---");
        console.log(snippet);
        console.log("---------------\n");

        const targets = ["D1902.0080", "IED010", "FB010", "XFB010", "EHU010"];

        console.log("\n--- TARGET SEARCH ---");
        for (const t of targets) {
            if (data.text.includes(t)) {
                console.log(`\nFOUND '${t}'!`);
                const index = data.text.indexOf(t);
                // Print a generous window to see newlines and spacing
                console.log(JSON.stringify(data.text.substring(index, index + 150)));
            } else {
                console.log(`\nCode '${t}' NOT found.`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
