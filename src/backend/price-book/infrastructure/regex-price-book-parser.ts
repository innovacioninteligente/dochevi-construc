
import { PriceBookItem } from '../domain/price-book-item';
import { PriceBookRepository } from '../domain/price-book-repository'; // Not used but good ref

export class RegexPriceBookParser {

    async parsePdf(fileUrl: string, year: number, onProgress?: (percent: number) => Promise<void>, onLog?: (message: string) => Promise<void>): Promise<PriceBookItem[]> {
        const log = async (msg: string) => {
            console.log(msg);
            if (onLog) await onLog(msg);
        };

        await log(`[RegexParser] Downloading PDF for year ${year}...`);

        let buffer: Buffer;

        if (fileUrl.startsWith('http')) {
            const response = await fetch(fileUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            // Local file support (needed for testing)
            const fs = await import('fs/promises');
            buffer = await fs.readFile(fileUrl);
        }

        console.log(`[RegexParser] Extracting text with pdf-parse...`);

        // Using pdf-parse v2 (mehmet-kozan fork) as requested
        // API: const { PDFParse } = require('pdf-parse');
        // @ts-ignore
        const { PDFParse } = require('pdf-parse');

        // Instantiate parser with buffer
        // @ts-ignore
        const parser = new PDFParse({ data: buffer });

        console.log(`[RegexParser] Extracting text with PDFParse (v2)...`);

        // Extract text
        const data = await parser.getText();

        // Destroy parser instance to free memory (as per docs)
        if (parser.destroy) {
            await parser.destroy();
        }

        console.log(`[RegexParser] Text extracted. Length: ${data.text.length} chars. Preview:\n${data.text.substring(0, 500)}...`);

        // Robust splitting for various EOL formats
        const lines = data.text.split(/\r\n|\n|\r/);
        const items: PriceBookItem[] = [];
        let currentItem: Partial<PriceBookItem> | null = null;

        // Regex Strategies
        // Pattern: Code space Unit space Desc space Price
        // Code: Uppercase/Digits/Dots (e.g., EHU010, 1.2.3) -> ([A-Z0-9\.]+)
        // Unit: Alphanum + % + . + / (e.g., m2, p.a., u., m3/h) -> ([a-zA-Z0-9%\./]+)
        // Price: European format (1.234,56) or simple (10,50). 
        //        Matches: 123,45 | 1.234,45 | -10,00
        //        Regex: ([-]?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)

        // Regex Strategies derived from specific PDF analysis (libro_precios_2024.pdf)
        // OBSERVED PATTERN (WINNER): Code Unit Price Description
        // Example: "DQC040 m² 17,41 Desmontaje de cobertura..."
        // Updated: Allow Code to contain lowercase letters (suffixes like 'b', 'c', e.g. DQC030b)
        // Must start with Uppercase to differentiate from breakdown codes (mt...)

        // Group 1: Code (Uppercase start, alphanumeric+dots) -> ([A-Z][a-zA-Z0-9\.]+)
        // Group 2: Unit (alphanum + symbols) -> ([a-zA-Z0-9%\./²³]+)
        // Pattern: Code Unit Price Description (Adjusted for merged units and alphanumeric codes)
        // 1. Code: Starts with [A-Z0-9], followed by alphanumeric/dots. Lazy match to handle merged units.
        // 2. Separator: Space OR (Lookbehind Digit + Lookahead Letter/%).
        // 3. Unit: Alphanumeric + % . / superscripts.
        // 4. Price: Standard number format. MUST HAVE COMMA (decimal) to avoid false positives with integers.
        // 5. Description: Rest of line.
        const mainPattern =
            /^([A-Z0-9][a-zA-Z0-9\.]*?)(?:\s+|(?<=\d)(?=[a-zA-Z%]))([a-zA-Z0-9%\./²³]+)\s+([-]?\d{1,3}(?:\.\d{3})*,\d{1,2})\s+(.+)$/;

        // Fallback Pattern (Legacy/Standard): Code Unit Description Price
        const fallbackPattern = /^([A-Z0-9\.]+)\s+([a-zA-Z0-9%\.\/]+)\s+(.+)\s+([-]?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)$/;

        let processedLines = 0;
        const totalLines = lines.length;
        console.log(`[RegexParser] Lines to process: ${totalLines}`);

        for (const line of lines) {
            processedLines++;
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Filter out junk
            if (trimmed.includes("PRECIOS") || trimmed.includes("Página") || trimmed.includes("-- 1 of")) continue;

            // Check for New Item Start
            let match = trimmed.match(mainPattern);
            let isFallback = false;

            if (!match) {
                match = trimmed.match(fallbackPattern);
                isFallback = true;
            }

            if (match) {
                // If we have a previous item, save it
                if (currentItem) {
                    items.push(this.finalizeItem(currentItem));
                }

                // Parse Price safely
                // Main Pattern (Price First): Group 3 is Price. 
                // Fallback Pattern (Price Last): Group 4 is Price.
                const priceGroupIndex = isFallback ? 4 : 3;
                const rawPrice = match[priceGroupIndex].replace(/\./g, '').replace(',', '.');
                const priceVal = parseFloat(rawPrice);

                // Parse Desc
                // Main Pattern (Desc Last): Group 4 is Desc.
                // Fallback Pattern (Desc Middle): Group 3 is Desc.
                const descGroupIndex = isFallback ? 3 : 4;
                let description = match[descGroupIndex].trim();

                // CLEANING: Remove merged page footers/headers (e.g. "Exterior PAVIMENTOS... -- N of M --")
                description = description.replace(
                    /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9\.\-]*\s+)+-- \d+ of \d+ --.*$/,
                    ''
                );

                // CLEANING: Remove merged structural headers at end of string (e.g. "Forjados DEMOLICIONES Forjados")
                // Only if they match the structural pattern and are at the end
                description = description.replace(
                    /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9]*\s*){2,}$/,
                    ''
                );

                // CLEANING: Remove merged Breakdown Codes
                description = description.replace(/\s+[A-Z]\d{4}\.\d{4}.*$/, '');
                description = description.replace(/\s+[a-z]{2}\d{2,}.*$/, '');

                // Log to console for debugging, but prevent spamming the Firestore document (1MB limit)
                console.log(`[RegexParser] Extracted Item: ${match[1]} (${match[2]}) - ${priceVal} - ${description.substring(0, 30)}...`);

                // Only notify UI every 50 items to keep job document small
                if (items.length % 50 === 0) {
                    // We don't await this to avoid blocking the loop too much, fire and forget or await if critical
                    if (onLog) onLog(`Extracted ${items.length} items... (Last: ${match[1]})`);
                }

                currentItem = {
                    year,
                    code: match[1],
                    unit: match[2],
                    description: description,
                    priceTotal: isNaN(priceVal) ? 0 : priceVal,
                    priceLabor: 0,
                    priceMaterial: 0,
                    createdAt: new Date()
                };
            } else {
                // Continuation or Breakdown?
                if (currentItem) {
                    // Filtering: Ignore "garbage" lines like page headers/footers
                    // Example: "Exterior PAVIMENTOS DE MADERA Exterior -- 364 of 407 --"
                    const isPageFooter = /-- \d+ of \d+ --/;
                    if (isPageFooter.test(trimmed)) {
                        // Console log, don't spam UI
                        console.log(`Skipping garbage line: ${trimmed}`);
                        continue;
                    }

                    // Garbage Filter: Structural Lines / Section Headers
                    // Logic:
                    // 1. All Uppercase (e.g. "DEMOLICIONES", "MOVIMIENTO DE TIERRAS") - allow short codes but not full lines
                    // 2. Title Case structural repeat (e.g. "Forjados", "Forjados DEMOLICIONES Forjados")
                    // Check if line is purely uppercase words and spaces (min length 4 to avoid units/codes)
                    const isAllUppercase = /^[A-ZÁÉÍÓÚÑ\s\.]+$/.test(trimmed) && trimmed.length > 4;

                    // Check for strict Title Case (Start with Upper, rest lower) or mixed Uppercase words
                    const isStructural = isAllUppercase || /^(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9]*\s*)+$/.test(trimmed);

                    if (isStructural && trimmed.length < 60) {
                        console.log(`Skipping structural garbage: ${trimmed}`);
                        continue;
                    }

                    // B) Check if this line is a "Breakdown Code" (e.g., mt12, %, etc.)
                    // Logic: Starts with '%' OR Starts with 2 lowercase letters + 1 digits OR %)
                    // STRICTER Pattern: avoids matching "carga", "con", "y" etc.
                    // Removed \s+ because breakdown codes can be long strings without spaces immediately after digits
                    const isBreakdown = /^([a-z]{2}\d|%)/.test(trimmed);

                    // Validate if it's strictly a breakdown line (starts with code)
                    // If it starts with text then breakdown code (merged), we clean it below
                    if (isBreakdown) {
                        console.log(`Skipping breakdown line: ${trimmed}`);
                        continue;
                    }

                    // It's a description continuation
                    // CLEANING: Remove merged page footers/headers
                    let cleanLine = trimmed.replace(
                        /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9\.\-]*\s+)+-- \d+ of \d+ --.*$/,
                        ''
                    );

                    // CLEANING: Remove merged structural headers at end of string
                    cleanLine = cleanLine.replace(
                        /\s+(?:[A-ZÁÉÍÓÚÑ][a-zA-ZÁÉÍÓÚÑ0-9]*\s*){2,}$/,
                        ''
                    );

                    // CLEANING: Remove merged Breakdown Codes from continuation lines
                    cleanLine = cleanLine.replace(/\s+[A-Z]\d{4}\.\d{4}.*$/, '');
                    cleanLine = cleanLine.replace(/\s+[a-z]{2}\d{2,}.*$/, '');

                    if (currentItem) {
                        currentItem.description += " " + cleanLine;
                    }
                }
            }

            // Progress update every 500 lines
            if (onProgress && processedLines % 500 === 0) {
                const percent = Math.min(99, Math.round((processedLines / totalLines) * 100));
                await onProgress(percent);
            }
        }

        // Push last item
        if (currentItem) {
            items.push(this.finalizeItem(currentItem));
        }

        console.log(`[RegexParser] Parsed ${items.length} items.`);
        return items;
    }

    private finalizeItem(item: Partial<PriceBookItem>): PriceBookItem {
        return {
            ...item,
            searchKeywords: item.description ? item.description.toLowerCase().split(' ') : []
        } as PriceBookItem;
    }

    // Default renderer to text (optional, pdf-parse uses one by default)
    private renderPage(pageData: any) {
        // Just return text
        return pageData.getTextContent()
            .then((textContent: any) => {
                let lastY, text = '';
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    }
                    else {
                        text += '\n' + item.str; // New line for new Y
                    }
                    lastY = item.transform[5];
                }
                return text;
            });
    }
}
