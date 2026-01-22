
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
// @ts-ignore
const pdf = require('pdf-parse');

async function main() {
    const filePath = path.resolve('public/documents/Libro Precios 46_COAATMCA.pdf');
    console.log(`Analyzing PDF Text Structure: ${filePath}`);

    const dataBuffer = fs.readFileSync(filePath);

    try {
        const data = await pdf(dataBuffer);

        // Let's look at a specific "slice" of text where we expect items (e.g. "990320647")
        // We'll just look at a middle chunk of the text to avoid index/cover pages.
        // Assuming ~3000 chars per page, let's grab from char 100,000 to 105,000

        const center = Math.floor(data.text.length / 2);
        const snippet = data.text.substring(center, center + 5000);

        console.log("--- RAW TEXT SNIPPET (Center of Doc) ---");
        console.log(snippet);
        console.log("----------------------------------------");

        // Heuristic check for the user's example code
        const regexSample = /990320647/g;
        if (regexSample.test(data.text)) {
            console.log("FOUND SPECIFIC CODE '990320647' in the text!");
            const index = data.text.indexOf("990320647");
            console.log("Context around Code:", data.text.substring(index, index + 200));
        } else {
            console.log("Code '990320647' NOT found in text dump. Maybe it's an image or different encoding?");
        }

    } catch (e) {
        console.error("Error parsing PDF:", e);
    }
}

main();
