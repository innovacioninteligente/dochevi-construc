/**
 * Measurement Extraction Flow
 * 
 * Uses Gemini Vision to extract line items (partidas) from a "Estado de Mediciones" PDF.
 * Input: Base64 encoded PDF or image
 * Output: Array of measurement items with code, description, unit, quantity
 */

import { ai, gemini25Flash } from '../../config/genkit.config';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

// Schema for extracted measurement items
export const MeasurementItemSchema = z.object({
    order: z.number().describe('Order/sequence number in the document'),
    code: z.string().optional().describe('Item code if present (e.g., 1.1, 2.3, etc.)'),
    description: z.string().describe('Full description of the work item'),
    unit: z.string().describe('Unit of measure (m2, m, ud, kg, etc.)'),
    quantity: z.number().describe('Measured quantity'),
    // These will be filled later by pricing flow
    unitPrice: z.number().optional(),
    totalPrice: z.number().optional(),
    // Added for classification
    type: z.enum(['PARTIDA', 'MATERIAL']).optional().describe('Classify if this is a labor unit (Partida) or pure supply (Material)'),
    page: z.number().optional().describe('Page number where this item was found'),
    chapter: z.string().optional().describe('Chapter name derived from context'),
    section: z.string().optional().describe('Section name derived from context'),
});

export type MeasurementItem = z.infer<typeof MeasurementItemSchema>;

const PageExtractionOutputSchema = z.object({
    items: z.array(MeasurementItemSchema).describe('List of measurement items found on this page'),
    detectedChapter: z.string().optional().describe('Chapter detected on this page (if any)'),
    detectedSection: z.string().optional().describe('Section detected on this page (if any)'),
    continuationDescription: z.string().optional().describe('If a description continues from previous page'),
});

const ExtractionOutputSchema = z.object({
    projectName: z.string().optional().describe('Project name if identified'),
    clientName: z.string().optional().describe('Client name if identified'),
    items: z.array(MeasurementItemSchema).describe('List of all measurement items extracted'),
    pageCount: z.number().optional().describe('Number of pages processed'),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

const getExtractionPrompt = (context: { chapter?: string, section?: string }) => `
Eres un experto en extracción de datos de documentos de construcción.
Estás analizando UNA SOLA PÁGINA de un documento PDF "Estado de Mediciones".

Contexto Anterior:
- Capítulo Actual: "${context.chapter || 'Desconocido'}"
- Sección Actual: "${context.section || 'Desconocida'}"

Tarea:
1. Analiza la imagen de esta página.
2. Identifica si hay un cambio de Capítulo o Sección (textos grandes/negrita).
3. Extrae TODAS las partidas (líneas de medición) visibles en esta página.
4. Si una descripción parece continuar de la página anterior, inclúyela completa.

Para cada partida, extrae:
- order: número secuencial
- code: código (ej: 1.1, 2.3). Si no hay, déjalo vacío.
- description: descripción del trabajo.
- unit: unidad (m², m, ud).
- quantity: cantidad.
- type: Clasifica el item:
    - "PARTIDA": Si implica mano de obra + materiales (ej: "Demolición de tabique", "Alicatado de baño").
    - "MATERIAL": Si es solo suministro de un producto (ej: "Grifo monomando", "Saco de cemento").

IMPORTANTE SOBRE NÚMEROS:
- El documento usa formato europeo/español: ',' para decimales y '.' para miles.
- Ejemplo: "1.200,50" es mil doscientos con cincuenta (1200.5).
- Ejemplo: "30,00" es treinta (30). NO lo confundas con tres mil.
- Ejemplo: "10.000" si son m2 en una vivienda, probablemente sea 10 con 3 decimales (10), no diez mil. Usa el sentido común.
- Devuelve SIEMPRE el número en formato JSON estándar (punto para decimales, sin separador de miles).

Formato JSON Estricto:
{
  "detectedChapter": "Nuevo Capítulo detectado o null",
  "detectedSection": "Nueva Sección detectada o null",
  "items": [ ... ]
}`;

export const measurementExtractionFlow = ai.defineFlow(
    {
        name: 'measurementExtractionFlow',
        inputSchema: z.object({
            pdfBase64: z.string().describe('Base64 encoded PDF'),
            mimeType: z.string().default('application/pdf'),
        }),
        outputSchema: ExtractionOutputSchema,
    },
    async ({ pdfBase64 }) => {
        console.log('[MeasurementExtraction] Starting Hybrid Page-by-Page extraction...');

        // 1. Load PDF
        const pdfDoc = await PDFDocument.load(pdfBase64);
        const pageCount = pdfDoc.getPageCount();
        console.log(`[MeasurementExtraction] PDF loaded. Pages: ${pageCount}`);

        const allItems: MeasurementItem[] = [];
        let currentChapter = '';
        let currentSection = '';

        // 2. Iterate Pages
        // Limit to first 5 pages for dev/testing if needed, or process all. 
        // For production, we process all but safeguard against loop limits.
        const maxPages = pageCount;

        for (let i = 0; i < maxPages; i++) {
            const pageNum = i + 1;
            console.log(`[MeasurementExtraction] Processing Page ${pageNum}/${pageCount}...`);

            // Create a single-page PDF
            const subPdf = await PDFDocument.create();
            const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
            subPdf.addPage(copiedPage);
            const subPdfBytes = await subPdf.saveAsBase64();

            // Prepare Context & Prompt
            const promptText = getExtractionPrompt({ chapter: currentChapter, section: currentSection });

            try {
                // Call Gemini for this page
                const { output } = await ai.generate({
                    model: gemini25Flash,
                    prompt: [
                        { text: promptText },
                        {
                            media: {
                                url: `data:application/pdf;base64,${subPdfBytes}`,
                                contentType: 'application/pdf'
                            }
                        }
                    ],
                    output: { schema: PageExtractionOutputSchema },
                    config: { temperature: 0.1 }
                });

                if (output) {
                    // Update Context
                    if (output.detectedChapter) currentChapter = output.detectedChapter;
                    if (output.detectedSection) currentSection = output.detectedSection;

                    // Enrich Items with Context & Page
                    const enrichedItems = output.items.map(item => ({
                        ...item,
                        page: pageNum,
                        chapter: currentChapter,
                        section: currentSection
                    }));

                    allItems.push(...enrichedItems);
                    console.log(`  -> Page ${pageNum}: Found ${enrichedItems.length} items. (Context: ${currentChapter} / ${currentSection})`);
                }
            } catch (error) {
                console.error(`  -> Error processing page ${pageNum}:`, error);
                // Continue to next page rather than failing entire batch
            }
        }

        console.log(`[MeasurementExtraction] Complete. Total items: ${allItems.length}`);

        return {
            items: allItems,
            pageCount: pageCount,
            projectName: 'Detected Project', // Could be extracted from Page 1
        };
    }
);
