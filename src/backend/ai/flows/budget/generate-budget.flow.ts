import { z } from 'zod';
import { ai } from '@/backend/ai/config/genkit.config';
import { extractionFlow } from './extraction.flow';
import { priceBookRetrieverTool } from '@/backend/ai/tools/price-book-retriever.tool';
import { FirestoreBudgetConfigRepository } from '@/backend/budget/infrastructure/firestore-budget-config.repository';
import { webPriceSearchTool } from '@/backend/ai/tools/web-price-search.tool';
import { FirestorePendingPriceItemRepository } from '@/backend/budget/infrastructure/firestore-pending-item.repository';
import { randomUUID } from 'crypto';

const BudgetLineItemSchema = z.object({
    order: z.number(),
    originalTask: z.string(),
    found: z.boolean(),
    isEstimate: z.boolean().optional(),
    item: z.object({
        code: z.string(),
        description: z.string(),
        unit: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
    }).optional(),
    note: z.string().optional(),
});

export const generateBudgetFlow = ai.defineFlow(
    {
        name: 'generateBudgetFlow',
        inputSchema: z.object({
            userRequest: z.string(),
        }),
        outputSchema: z.object({
            lineItems: z.array(BudgetLineItemSchema),
            costBreakdown: z.object({
                materialExecutionPrice: z.number(), // PEM
                overheadExpenses: z.number(), // Gastos Generales
                industrialBenefit: z.number(), // Beneficio Industrial
                tax: z.number(), // IVA
                globalAdjustment: z.number(), // Ajuste Global
                total: z.number(), // PEC (Presupuesto Ejecución por Contrata) + IVA
            }),
            totalEstimated: z.number(), // For backward/simple compatibility
        }),
    },
    async (input) => {
        // 0. Load Configuration & Repos
        const configRepo = new FirestoreBudgetConfigRepository();
        const pendingItemRepo = new FirestorePendingPriceItemRepository();
        const config = await configRepo.getConfig();
        console.log(`[Flow] Loaded budget config: Adjustment=${config.globalAdjustmentFactor}, Margin=${config.industrialBenefit}`);

        // 1. Extract Intents/Subtasks
        console.log(">> 1. Extracting subtasks...");
        const extractionResult = await extractionFlow({ userRequest: input.userRequest });

        if (!extractionResult?.subtasks) {
            throw new Error("Could not extract tasks from request");
        }

        const subtasks = extractionResult.subtasks;
        console.log(`>> Extracted ${subtasks.length} subtasks.`);

        const lineItems = [];
        let materialExecutionPrice = 0; // PEM

        // 2. Search for each item
        for (let i = 0; i < subtasks.length; i++) {
            const task = subtasks[i] as any; // Cast because extractionFlow types might not be inferred immediately
            console.log(`>> 2.${i} Searching for: ${task.searchQuery}`);

            // A. Try Price Book
            const searchResult = await priceBookRetrieverTool({ query: task.searchQuery, limit: 1, year: 2024 });
            let bestMatch = searchResult.items && searchResult.items.length > 0 ? searchResult.items[0] : null;

            // Validation: Keyword Check (Prevent Vector Hallucinations)
            if (bestMatch) {
                const queryWords = task.searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((w: string) => w.length > 3);
                const descNormalized = bestMatch.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const hasMatch = queryWords.some((w: string) => descNormalized.includes(w));

                if (!hasMatch && queryWords.length > 0) {
                    console.log(`[Validation] Rejecting semantic match "${bestMatch.code}" for query "${task.searchQuery}". No keyword overlap.`);
                    bestMatch = null; // Force fallback
                }
            }

            if (bestMatch) {
                const quantity = task.quantity || 1;
                const totalPrice = bestMatch.priceTotal * quantity;

                lineItems.push({
                    order: i + 1,
                    originalTask: `${task.searchQuery} (${quantity} ${task.unit})`,
                    found: true,
                    isEstimate: false,
                    item: {
                        code: bestMatch.code,
                        description: bestMatch.description,
                        unit: bestMatch.unit,
                        quantity: quantity,
                        unitPrice: bestMatch.priceTotal,
                        totalPrice: totalPrice
                    },
                    note: `Linked to Price Book. ${quantity} x ${bestMatch.priceTotal}€`
                });
                materialExecutionPrice += totalPrice;
            } else {
                // B. Fallback: Estimator Tool
                console.log(`>> Item not found. Triggering Fallback Estimator for: ${task.searchQuery}`);
                try {
                    const fallback = await webPriceSearchTool({ query: task.searchQuery });
                    const quantity = task.quantity || 1;
                    const estimatedTotal = fallback.price * quantity;
                    const pendingId = randomUUID();

                    // Save to Pending Items for Admin Review
                    await pendingItemRepo.create({
                        id: pendingId,
                        searchQuery: task.searchQuery,
                        suggestedDescription: fallback.description,
                        suggestedPrice: fallback.price,
                        suggestedUnit: fallback.unit,
                        sourceUrl: fallback.source,
                        status: 'pending',
                        createdAt: new Date()
                    });

                    lineItems.push({
                        order: i + 1,
                        originalTask: `${task.searchQuery} (${quantity} ${task.unit})`,
                        found: true, // It is "found" via fallback
                        isEstimate: true, // Flag as estimate
                        item: {
                            code: `PENDING-${pendingId.substring(0, 6)}`,
                            description: fallback.description,
                            unit: fallback.unit,
                            quantity: quantity,
                            unitPrice: fallback.price,
                            totalPrice: estimatedTotal
                        },
                        note: `⚠️ Estimado por IA (${fallback.source}). Pendiente validación.`
                    });
                    materialExecutionPrice += estimatedTotal;

                } catch (err) {
                    console.error("Fallback failed:", err);
                    lineItems.push({
                        order: i + 1,
                        originalTask: task.searchQuery,
                        found: false,
                        note: "No se encontró precio ni estimación."
                    });
                }
            }
        }

        // 3. Apply Budget Logic (Structure Cost)
        // PEM = Sum of items
        const overheadExpenses = materialExecutionPrice * config.overheadExpenses;
        const industrialBenefit = materialExecutionPrice * config.industrialBenefit;
        const subtotal = materialExecutionPrice + overheadExpenses + industrialBenefit;
        const tax = subtotal * config.iva;

        let total = subtotal + tax;

        // 4. Apply Global Adjustment Factor
        const preAdjustment = total;
        total = total * config.globalAdjustmentFactor;
        const adjustmentAmount = total - preAdjustment;

        console.log(`[Flow] Calculated: PEM=${materialExecutionPrice}, Total=${total}`);

        return {
            lineItems,
            costBreakdown: {
                materialExecutionPrice,
                overheadExpenses,
                industrialBenefit,
                tax,
                globalAdjustment: adjustmentAmount,
                total
            },
            totalEstimated: total
        };
    }
);
