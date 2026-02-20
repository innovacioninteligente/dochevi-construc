/**
 * Measurement Pricing Flow
 * 
 * Takes extracted measurement items and finds matching prices using vector search.
 * Calculates totals and generates a priced budget.
 * 
 * New Features:
 * - Batched Processing (Promise.all)
 * - Unified Catalog Search (PriceBook + Materials)
 * - Smart Fallback (Materials + Estimated Labor)
 */

import { ai } from '@/backend/ai/config/genkit.config';
import { z } from 'zod';
import { MeasurementItemSchema, measurementExtractionFlow } from './measurement-extraction.flow';
import { CatalogSearchService } from '@/backend/catalog/application/catalog-search.service';
import { UnifiedCatalogItem } from '@/backend/catalog/domain/catalog-item';
import { DEFAULT_BUDGET_CONFIG } from '@/backend/budget/domain/budget-config';

// Schema for priced items
export const PricedMeasurementItemSchema = MeasurementItemSchema.extend({
    unitPrice: z.number().describe('Unit price from Price Book'),
    totalPrice: z.number().describe('Total price (quantity * unitPrice)'),
    priceBookCode: z.string().optional().describe('Matched Price Book item code'),
    matchConfidence: z.number().min(0).max(100).describe('Confidence of the match (0-100)'),
    isEstimate: z.boolean().describe('Whether price is an AI estimate vs matched'),
    matchType: z.enum(['LABOR', 'MATERIAL', 'ESTIMATE']).optional().describe('Type of match found'),
    matchName: z.string().optional().describe('Name of the matched item'),
    // Ensure these are explicitly carried over
    page: z.number().optional(),
    chapter: z.string().optional(),
    section: z.string().optional(),
});

export type PricedMeasurementItem = z.infer<typeof PricedMeasurementItemSchema>;

const PricingOutputSchema = z.object({
    projectName: z.string().optional(),
    clientName: z.string().optional(),
    projectType: z.string().optional().describe('Detected project type (e.g., Reform, New Build)'),
    items: z.array(PricedMeasurementItemSchema),
    summary: z.object({
        totalItems: z.number(),
        matchedItems: z.number(),
        estimatedItems: z.number(),
        subtotal: z.number(),
        overheadExpenses: z.number().describe('13% Gastos Generales'),
        industrialBenefit: z.number().describe('6% Beneficio Industrial'),
        pemConGG: z.number().describe('PEM + GG + BI'),
        iva: z.number().describe('21% IVA'),
        total: z.number(),
    }),
});

export type PricingOutput = z.infer<typeof PricingOutputSchema>;

const catalogService = new CatalogSearchService();

// Batch size for concurrent processing
const BATCH_SIZE = 5;

/**
 * Heuristic to detect project type based on items
 */
function detectProjectType(items: any[]): string {
    const text = items.map(i => i.description).join(' ').toLowerCase();
    if (text.includes('demolicion') || text.includes('retirada')) return 'Reforma Integral';
    if (text.includes('cimentacion') || text.includes('estructura')) return 'Obra Nueva';
    if (text.includes('baño') || text.includes('sanitario')) return 'Reforma Baño';
    if (text.includes('cocina')) return 'Reforma Cocina';
    return 'Obra General';
}

async function processBatch(items: any[]): Promise<PricedMeasurementItem[]> {
    const promises = items.map(async (item) => {
        try {
            // 1. Search in Unified Catalog
            const results = await catalogService.search(item.description, 3); // 3 per source

            // 2. Select Best Match
            let bestMatch: UnifiedCatalogItem | null = null;
            let matchType: 'LABOR' | 'MATERIAL' | 'ESTIMATE' = 'ESTIMATE';
            let finalPrice = 0;
            let confidence = 0;

            // Priority 1: Labor/Partida match (High Confidence)
            const laborMatch = results.find(r => r.type === 'LABOR');
            // Priority 2: Material match
            const materialMatch = results.find(r => r.type === 'MATERIAL');

            if (laborMatch) {
                bestMatch = laborMatch;
                matchType = 'LABOR';
                finalPrice = laborMatch.price;
                confidence = 85;
            } else if (materialMatch) {
                bestMatch = materialMatch;
                matchType = 'MATERIAL';
                // Material Price + 40% Installation Estimate
                finalPrice = materialMatch.price * 1.4;
                confidence = 60; // Lower confidence because labor is estimated
            } else {
                // Fallback
                matchType = 'ESTIMATE';
                finalPrice = estimateFallbackPrice(item);
                confidence = 30;
            }

            return {
                ...item,
                unitPrice: finalPrice,
                totalPrice: finalPrice * item.quantity,
                priceBookCode: bestMatch?.code,
                matchConfidence: confidence,
                isEstimate: matchType === 'ESTIMATE',
                matchType: matchType,
                matchName: bestMatch?.name,
                page: item.page,
                chapter: item.chapter,
                section: item.section,
            };

        } catch (error) {
            console.error(`Error pricing item ${item.description}:`, error);
            // Return fallback on error
            const fallback = estimateFallbackPrice(item);
            return {
                ...item,
                unitPrice: fallback,
                totalPrice: fallback * item.quantity,
                isEstimate: true,
                matchType: 'ESTIMATE',
                matchConfidence: 0
            };
        }
    });

    return Promise.all(promises);
}

export const measurementPricingFlow = ai.defineFlow(
    {
        name: 'measurementPricingFlow',
        inputSchema: z.object({
            pdfBase64: z.string().describe('Base64 encoded PDF'),
            mimeType: z.string().default('application/pdf'),
        }),
        outputSchema: PricingOutputSchema,
    },
    async ({ pdfBase64, mimeType }) => {
        console.log('[MeasurementPricing] Starting Batched Hybrid Pipeline...');

        // Step 1: Extract measurements
        const extraction = await measurementExtractionFlow({ pdfBase64, mimeType });
        console.log(`[MeasurementPricing] Extracted ${extraction.items.length} items. Processing in batches of ${BATCH_SIZE}...`);

        const projectType = detectProjectType(extraction.items);
        console.log(`[MeasurementPricing] Detected Project Type: ${projectType}`);

        // Step 2: Batched Pricing
        const pricedItems: PricedMeasurementItem[] = [];

        for (let i = 0; i < extraction.items.length; i += BATCH_SIZE) {
            const batch = extraction.items.slice(i, i + BATCH_SIZE);
            console.log(`[MeasurementPricing] Processing batch ${i / BATCH_SIZE + 1}...`);
            const processedBatch = await processBatch(batch);
            pricedItems.push(...processedBatch);
        }

        const matchedCount = pricedItems.filter(i => !i.isEstimate).length;

        // Step 3: Calculate summary
        // Use Default Config (In future, fetch strict config from DB)
        const config = DEFAULT_BUDGET_CONFIG;

        const subtotal = pricedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        // Apply margins
        const overheadExpenses = subtotal * config.overheadExpenses;
        const industrialBenefit = subtotal * config.industrialBenefit;
        const pemConGG = subtotal + overheadExpenses + industrialBenefit;
        const iva = pemConGG * config.iva;
        const total = pemConGG + iva;

        console.log(`[MeasurementPricing] Complete. ${matchedCount}/${pricedItems.length} matched. Total: €${total.toFixed(2)}`);

        return {
            projectName: extraction.projectName,
            clientName: extraction.clientName,
            projectType,
            items: pricedItems,
            summary: {
                totalItems: pricedItems.length,
                matchedItems: matchedCount,
                estimatedItems: pricedItems.length - matchedCount,
                subtotal,
                overheadExpenses,
                industrialBenefit,
                pemConGG,
                iva,
                total,
            },
        };
    }
);

function estimateFallbackPrice(item: any): number {
    // Simple heuristic for fallback pricing based on unit type
    const unitPrices: Record<string, number> = {
        'm²': 25,
        'm2': 25,
        'm': 15,
        'ml': 15,
        'ud': 50,
        'u': 50,
        'kg': 2,
        'h': 35,
        'pa': 100,
    };

    const unit = item.unit?.toLowerCase() || '';
    return unitPrices[unit] || 30; // Default €30
}
