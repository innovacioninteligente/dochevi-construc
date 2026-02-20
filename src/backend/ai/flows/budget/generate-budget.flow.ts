import { z } from 'zod';
import { ai } from '@/backend/ai/config/genkit.config';
import { extractionFlow } from './extraction.flow';
import { resolveItemFlow } from '@/backend/ai/agents/resolve-item.flow';
import { validationAgent } from '@/backend/ai/agents/validation.agent';
import { FirestoreBudgetConfigRepository } from '@/backend/budget/infrastructure/firestore-budget-config.repository';
import { randomUUID } from 'crypto';
import { BudgetPartida, BudgetMaterial, BudgetChapter } from '@/backend/budget/domain/budget';
import { getCurrentContext } from '@/backend/ai/context/genkit.context';

const BudgetChapterZodSchema = z.custom<BudgetChapter>();

// Helper to remove undefined values for Firestore
function sanitizeForFirestore(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (value === undefined) return null; // Or omit
        return value;
    }));
}

export const generateBudgetFlow = ai.defineFlow(
    {
        name: 'generateBudgetFlow',
        inputSchema: z.object({
            userRequest: z.string(),
        }),
        outputSchema: z.object({
            chapters: z.array(BudgetChapterZodSchema),
            costBreakdown: z.object({
                materialExecutionPrice: z.number(),
                overheadExpenses: z.number(),
                industrialBenefit: z.number(),
                tax: z.number(),
                globalAdjustment: z.number(),
                total: z.number(),
            }),
            totalEstimated: z.number(),
        }),
    },
    async (input) => {
        // 0. Load Configuration
        const configRepo = new FirestoreBudgetConfigRepository();
        const config = await configRepo.getConfig();
        const ctx = getCurrentContext();
        console.log(`[Flow] Budget Config: Adj=${config.globalAdjustmentFactor}, Margin=${config.industrialBenefit}`);
        console.log(`[Flow] Execution Context: User=${ctx?.userId}, Role=${ctx?.role}`);

        // 1. Extract Intents
        console.log(">> 1. Extracting subtasks...");
        const extractionResult = await extractionFlow({ userRequest: input.userRequest });
        if (!extractionResult?.subtasks) throw new Error("Could not extract tasks");
        const subtasks = extractionResult.subtasks;

        // Notification
        if (ctx?.userId) {
            const { emitGenerationEvent } = await import('@/backend/budget/events/budget-generation.emitter');
            emitGenerationEvent(ctx.userId, 'subtasks_extracted', { count: subtasks.length, tasks: subtasks });
        }

        const lineItems: (BudgetPartida | BudgetMaterial)[] = [];
        let materialExecutionPrice = 0;

        // 2. Resolve each item via Agentic Orchestrator
        // We run these sequentially to avoid rate limits, or parallel if robust
        for (let i = 0; i < subtasks.length; i++) {
            const task = subtasks[i] as any;
            console.log(`>> 2.${i} Resolving: ${task.searchQuery}`);

            try {
                // Call the Orchestrator for this item
                const resolvedItem = await resolveItemFlow({
                    taskDescription: task.searchQuery,
                    quantity: task.quantity || 1,
                    unit: task.unit || 'u'
                });

                if (resolvedItem) {
                    resolvedItem.order = i + 1;
                    // Sanitize numeric values for Firestore
                    resolvedItem.unitPrice = resolvedItem.unitPrice || 0;
                    resolvedItem.totalPrice = resolvedItem.totalPrice || 0;
                    resolvedItem.quantity = resolvedItem.quantity || 0;

                    lineItems.push(resolvedItem);
                    console.log(`   + Added Item: ${resolvedItem.description.substring(0, 30)}... | UnitPrice: ${resolvedItem.unitPrice} | Qty: ${resolvedItem.quantity} | Total: ${resolvedItem.totalPrice}`);
                    materialExecutionPrice += resolvedItem.totalPrice;
                }
            } catch (err) {
                console.error(`Failed to resolve item '${task.searchQuery}':`, err);
                // Add error placeholder?
            }
        }

        // 3. Technical Validation (Async/Parallel)
        // We don't block the user, but we log or store the advice
        try {
            console.log(">> 3. Validating technical coherence...");
            const itemDescriptions = lineItems.map(i => i.description);
            const validationResult = await validationAgent({ items: itemDescriptions });
            console.log(`[Validation] Score: ${validationResult.overallScore}. Issues: ${validationResult.issues.length}`);
            // TODO: Store warnings in Budget metadata
        } catch (warn) {
            console.warn("Validation agent warning:", warn);
        }

        // 4. Create Default Chapter
        const defaultChapter: BudgetChapter = {
            id: randomUUID(),
            name: '01. Estimación Inicial (Agent V2)',
            order: 1,
            items: lineItems,
            totalPrice: materialExecutionPrice
        };

        // 5. Apply Financial Logic
        const overheadExpenses = materialExecutionPrice * config.overheadExpenses;
        const industrialBenefit = materialExecutionPrice * config.industrialBenefit;
        const subtotal = materialExecutionPrice + overheadExpenses + industrialBenefit;
        const tax = subtotal * config.iva;
        let total = subtotal + tax;

        // Global Adjustment
        const preAdjustment = total;
        total = total * config.globalAdjustmentFactor;
        const adjustmentAmount = total - preAdjustment;

        if (ctx?.userId) {
            const { emitGenerationEvent } = await import('@/backend/budget/events/budget-generation.emitter');
            emitGenerationEvent(ctx.userId, 'complete', { total: total, itemCount: lineItems.length });
        }

        const finalResult = {
            chapters: [defaultChapter],
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

        return sanitizeForFirestore(finalResult);
    }
);
