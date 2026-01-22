
const fs = require('fs');
const path = require('path');

// Safe Import for pdf-parse
let pdf;
try {
    pdf = require('pdf-parse');
} catch (e) {
    console.error("Could not require pdf-parse", e);
}

const PDF_PATH = path.join(process.cwd(), 'public/documents/libro_precios_2024.pdf');
const OUTPUT_PATH = path.join(process.cwd(), 'analysis_debug.json');

async function analyze() {
    console.log(`Analyzing PDF: ${PDF_PATH}`);

    if (!fs.existsSync(PDF_PATH)) {
        console.error("PDF not found!");
        return;
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);

    // Parse PDF
    let data;
    if (typeof pdf === 'function') {
        data = await pdf(dataBuffer);
    } else {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: dataBuffer });
        data = await parser.getText();
    }

    // Use full text
    const rawText = data.text;
    const lines = rawText.split(/\r\n|\n|\r/);

    console.log(`Analyzing first ${lines.length} lines of text...`);

    // Pattern A (Winner): Code Unit Price Description
    // Update: Allow Code to contain lowercase letters (suffixes like 'b', 'c')
    // Must start with Uppercase to differentiate from breakdown codes (mt...)
    // Pattern    // Pattern: Code Unit Price Description (Adjusted for merged units and alphanumeric codes)
    // Price MUST have a comma (decimal) to avoid matching "0 y 2 mm" as "0 y 2" (Code Unit Price)
    const mainPattern =
        /^([A-Z0-9][a-zA-Z0-9\.]*?)(?:\s+|(?<=\d)(?=[a-zA-Z%]))([a-zA-Z0-9%\./²³]+)\s+([-]?\d{1,3}(?:\.\d{3})*,\d{1,2})\s+(.+)$/;

    // Full Assembly State Machine
    const items = [];
    let currentItem = null;
    let processedLines = 0;

    for (const line of lines) {
        processedLines++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.includes("PRECIOS") || trimmed.includes("Página") || trimmed.includes("-- 1 of")) continue;

        const match = trimmed.match(mainPattern);

        if (match) {
            // New Item Found -> Save previous
            if (currentItem) {
                items.push(currentItem);
            }

            // Start new item
            let description = match[4];

            // CLEANING: Remove merged page footers/headers
            description = description.replace(
                /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9\.\-]*\s+)+-- \d+ of \d+ --.*$/,
                ''
            );

            // CLEANING: Remove merged Breakdown Codes (Start of breakdown list appended to desc)
            // Pattern: UpperCode (B0001.0030) or LowerCode (mt11...) followed by content
            const beforeClean = description;
            description = description.replace(/\s+[A-Z]\d{4}\.\d{4}.*$/, '');
            description = description.replace(/\s+[a-z]{2}\d{2,}.*$/, '');

            if (description.includes("B0001.0030")) {
                // console.log(`[DEBUG B0001] Before: "${beforeClean}"`);
                // console.log(`[DEBUG B0001] After: "${description}"`);
            }

            currentItem = {
                line: trimmed,
                code: match[1],
                unit: match[2],
                price: match[3],
                desc: description.trim()
            };
        } else {
            // Check if it is a breakdown line (to ignore) OR a description continuation
            // Breakdown regex: 2 lowercase letters followed by digit (e.g. mt51...) OR %
            // Garbage Filter: Ignore page footers/headers
            const isPageFooter = /-- \d+ of \d+ --/;
            if (isPageFooter.test(trimmed)) {
                // console.log(`Skipping garbage footer: ${trimmed}`);
                continue;
            }

            // Garbage Filter: Structural Lines / Section Headers
            // Logic:
            // 1. All Uppercase (e.g. "DEMOLICIONES", "MOVIMIENTO DE TIERRAS") - allow short codes but not full lines
            // 2. Title Case structural repeat (e.g. "Forjados", "Forjados DEMOLICIONES Forjados")
            // Check if line is purely uppercase words and spaces (min length 4 to avoid units/codes)
            const isAllUppercase = /^[A-ZÁÉÍÓÚÑ\s\.]+$/.test(trimmed) && trimmed.length > 4;

            // Check for strict Title Case (Start with Upper, rest lower) - risky if desc starts with Proper Noun
            // But usually descriptions are long sentences.
            // Let's filter if line is short (< 40 chars) and Title Case or Uppercase-heavy
            // "Forjados" -> length 8. "Forjados DEMOLICIONES Forjados" -> length ~30.
            const isStructural = isAllUppercase || /^(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9]*\s*)+$/.test(trimmed);

            if (isStructural && trimmed.length < 60) {
                console.log(`[SKIPPING STRUCTURAL]: ${trimmed}`);
                continue;
            }

            // Check for "Breakdown" lines (Garbage for us)
            // 1. Starts with % (Percentages)
            // 2. Starts with lowercase code like mt12, mo04 (Materials/Labor)
            // 3. Starts with Uppercase code structure like B0001.0030 (Auxiliary codes?)
            //    Regex: Start with char, digits, dot, digits.
            const isBreakdown = /^(\%|[a-z]{2}\d|[A-Z]\d{4}\.)/.test(trimmed);

            /*
            if (trimmed.includes("B0001.0030")) {
                 console.log(`[DEBUG CONTINUATION] Line: "${trimmed}"`);
                 console.log(`[DEBUG CONTINUATION] isBreakdown: ${isBreakdown}`);
            }
            */

            if (currentItem && !isBreakdown) {
                // It is NOT a breakdown code, so it MUST be a description line.
                // CLEANING: Remove merged structural headers at end of string
                currentItem.desc = currentItem.desc.replace(
                    /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9]*\s*){2,}$/,
                    ''
                );

                // CLEANING: Remove merged Breakdown Codes (Start of breakdown list appended to desc)
                // Pattern: UpperCode (B0001.0030) or LowerCode (mt11...) followed by content
                // We assume once a breakdown starts, the rest of the string is breakdown garbage.
                currentItem.desc = currentItem.desc.replace(/\s+[A-Z]\d{4}\.\d{4}.*$/, '');
                currentItem.desc = currentItem.desc.replace(/\s+[a-z]{2}\d{2,}.*$/, '');
                // Append to current description
                let cleanLine = trimmed.replace(/\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9\.\-]*\s+)+-- \d+ of \d+ --.*$/, "");

                // CLEANING: Remove merged Breakdown Codes from continuation lines
                cleanLine = cleanLine.replace(/\s+[A-Z]\d{4}\.\d{4}.*$/, '');
                cleanLine = cleanLine.replace(/\s+[a-z]{2}\d{2,}.*$/, '');

                currentItem.desc += " " + cleanLine;
            }
            // If isBreakdown is true, we just ignore it (do nothing)
        }
    }

    // Push last one
    if (currentItem) items.push(currentItem);

    console.log(`Extracted ${items.length} items.`);

    // Save to JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
    console.log("Analysis Complete. Results saved to", OUTPUT_PATH);
}

analyze();
