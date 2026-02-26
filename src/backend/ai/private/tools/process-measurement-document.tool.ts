import { ai } from '@/backend/ai/core/config/genkit.config';
import { z } from 'zod';
import { measurementPricingFlow } from '../flows/measurements/measurement-pricing.flow';
import { PDFDocument } from 'pdf-lib';
import { GeminiFilesService } from '../../core/infrastructure/gemini-files.service';

export const processMeasurementDocumentTool = ai.defineTool(
    {
        name: 'processMeasurementDocument',
        description: 'Processes an uploaded PDF "Estado de Mediciones" document. It uses OCR to extract EXACTLY the budget items (partidas) intact without altering descriptions, then enriches them with vector-based database pricing.',
        inputSchema: z.object({
            base64Data: z.string().describe('Base64 encoded string of the PDF file'),
            mimeType: z.string().default('application/pdf'),
            fileName: z.string().optional(),
            leadId: z.string().optional()
        }),
        outputSchema: z.object({
            status: z.enum(['PROCESSING_BACKGROUND', 'COMPLETED', 'ERROR']),
            message: z.string(),
            estimatedMinutes: z.number().optional(),
            jobId: z.string().optional(),
            data: z.any().optional()
        }),
    },
    async (input) => {
        const MAX_PAGES_SYNC = 5;
        const MAX_SIZE_MB = 2;

        // Approximate size check
        const sizeMb = (input.base64Data.length * 0.75) / (1024 * 1024);

        let shouldBatch = sizeMb > MAX_SIZE_MB;
        let hasTextLayer = false;

        // GATE 1: Fast Text Bypass via pdf2json
        try {
            const PDFParser = require('pdf2json');
            const pdfParser = new PDFParser(this, 1); // 1 = Return raw text

            const buffer = Buffer.from(input.base64Data, 'base64');

            const textContent: string = await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(buffer);
            });

            if (textContent && textContent.length > 500) {
                hasTextLayer = true;
                shouldBatch = false; // Bypass batch queue, use fast parallel text
                console.log(`[Measurement Tool] Text Layer found (${textContent.length} chars). Bypassing Batch API for strict parallel sync execution.`);
            }
        } catch (e) {
            console.warn("[Measurement Tool] text layer check failed", e);
        }

        if (!shouldBatch && !hasTextLayer) {
            try {
                const pdfDoc = await PDFDocument.load(input.base64Data);
                const pageCount = pdfDoc.getPageCount();
                if (pageCount > MAX_PAGES_SYNC) {
                    shouldBatch = true;
                }
            } catch (e) {
                console.error("[Measurement Tool] Failed to pre-parse PDF for page count:", e);
                shouldBatch = true; // Safe fallback
            }
        }

        if (shouldBatch) {
            console.log(`[Measurement Tool] Document is robust (${sizeMb.toFixed(2)} MB, ${input.base64Data.length > 0 ? "has pages" : "0"}). Triggering Gemini BATCH process.`);

            try {
                // 1. Upload to Gemini File API
                const uploadedPdf = await GeminiFilesService.uploadBase64(
                    input.base64Data,
                    input.mimeType || 'application/pdf',
                    input.fileName || `mediciones_${Date.now()}.pdf`
                );

                // 2. Prepare comprehensive prompt for entire document batch extraction
                const batchPrompt = `Eres un experto en construcción. Analiza este documento PDF completo ("Estado de Mediciones") y extrae TODAS las partidas (líneas de medición) de todas las páginas.

Para cada partida, extrae:
- order: número secuencial
- code: código (ej: 1.1, 2.3). Si no hay, déjalo vacío.
- description: descripción del trabajo completa.
- unit: unidad (m2, m, ud, kg).
- quantity: cantidad real encontrada.
- type: Clasifica el item: "PARTIDA" (mano de obra + materiales) o "MATERIAL" (solo suministro).

Devuelve un JSON estrictamente con la estructura:
{
  "items": [
    { "order": 1, "code": "1.1", "description": "Demolición...", "unit": "m2", "quantity": 10.5, "type": "PARTIDA" }
  ]
}
No devuelvas Markdown rodeando el JSON ni texto adicional. SOLO JSON.`;

                // 3. Create the Batch Job
                const batchJob = await GeminiFilesService.createBatchExtractionJob(uploadedPdf.uri!, batchPrompt);

                return {
                    status: 'PROCESSING_BACKGROUND' as const,
                    message: 'El documento es extenso y ha sido puesto en cola para procesamiento inteligente en la nube. Puedes consultar el progreso a la derecha.',
                    estimatedMinutes: 2,
                    jobId: batchJob.name
                };
            } catch (error) {
                console.error("[Measurement Tool] Failed to trigger batch job:", error);
                return {
                    status: 'ERROR' as const,
                    message: 'Hubo un problema al iniciar el análisis profundo del documento. Inténtalo de nuevo.'
                };
            }
        }

        // Execute Synchronously (Fast Text or Short Vision)
        console.log(`[Measurement Tool] Document mode: ${hasTextLayer ? 'FAST TEXT PARALLEL' : 'VISION SYNC'}. Executing Synchronously.`);
        try {
            const result = await measurementPricingFlow({
                pdfBase64: input.base64Data,
                mimeType: input.mimeType || 'application/pdf',
                useDeepSearch: true,
                leadId: input.leadId
            });

            if (input.leadId) {
                const budgetId = crypto.randomUUID();

                // Group items by chapter for the Budget Domain model
                const chaptersMap = new Map<string, any>();

                result.items.forEach((item: any) => {
                    const chapterName = item.chapter || 'General';
                    if (!chaptersMap.has(chapterName)) {
                        chaptersMap.set(chapterName, {
                            id: crypto.randomUUID(),
                            name: chapterName,
                            order: chaptersMap.size + 1,
                            items: []
                        });
                    }
                    chaptersMap.get(chapterName).items.push({
                        ...item,
                        id: crypto.randomUUID(),
                        type: 'PARTIDA', // Force valid class
                        ...(item.matchedItem?.breakdown ? { breakdown: item.matchedItem.breakdown } : {}), // Persist DB breakdowns to the budget natively
                        ...(item.matchedItem ? { matchedItem: item.matchedItem } : {}), // Track origin matched element
                        ...(item.candidates ? { candidates: item.candidates } : {}) // Track top 3 runner-up matches for HITL
                    });
                });

                const newBudget = {
                    id: budgetId,
                    leadId: input.leadId,
                    clientSnapshot: null,
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 1,
                    type: result.projectType === 'Obra Mayor' ? 'new_build' : 'renovation',
                    specs: {
                        projectDescription: result.projectName || 'Presupuesto desde PDF',
                        interventionType: result.projectType === 'Obra Mayor' ? 'new_build' : 'renovation',
                        spaces: [],
                        qualities: { general: 'medium' }
                    },
                    chapters: Array.from(chaptersMap.values()),
                    costBreakdown: result.summary,
                    totalEstimated: result.summary.total,
                    source: 'pdf_extraction'
                };

                const { BudgetRepositoryFirestore } = await import('@/backend/budget/infrastructure/budget-repository-firestore');
                const budgetRepository = new BudgetRepositoryFirestore();
                await budgetRepository.save(newBudget as any);

                return {
                    status: 'COMPLETED' as const,
                    message: 'Extracción completada con éxito. Las partidas se han enriquecido con los precios de la base de datos.',
                    data: {
                        id: budgetId,
                        total: result.summary.total,
                        itemCount: result.summary.totalItems,
                        ...result
                    }
                };
            }

            return {
                status: 'COMPLETED' as const,
                message: 'Extracción completada con éxito. Las partidas se han enriquecido con los precios de la base de datos.',
                data: result
            };
        } catch (error: any) {
            console.error("[Measurement Tool] Error in pricing flow:", error);
            return {
                status: 'ERROR' as const,
                message: 'Ocurrió un error al procesar el documento. Inténtalo de nuevo.'
            };
        }
    }
);
