import { ai } from '@/backend/ai/core/config/genkit.config';
import { z } from 'genkit';
import { triageAgent } from '@/backend/ai/public/agents/triage.agent';
import { budgetSearchAgent } from '@/backend/ai/private/agents/budget-search.agent';
import { estimationAgent } from '@/backend/ai/private/agents/estimation.agent';
import { BudgetPartida, BudgetMaterial } from '@/backend/budget/domain/budget';
import { randomUUID } from 'crypto';

export const resolveItemFlow = ai.defineFlow(
    {
        name: 'resolveItemFlow',
        inputSchema: z.object({
            taskDescription: z.string(),
            quantity: z.number(),
            unit: z.string(),
            leadId: z.string().optional(),
            context: z.string().optional()
        }),
        outputSchema: z.custom<BudgetPartida | BudgetMaterial>(),
    },
    async (input) => {
        console.log(`[ResolveItem] Triaging: "${input.taskDescription}"`);
        const decision = await triageAgent({ userRequest: input.taskDescription });

        const quantity = input.quantity;

        if (decision.tool === 'budgetSearchAgent') {
            const result = await budgetSearchAgent({
                query: decision.parameters.query,
                generic_query: decision.parameters.generic_query,
                intent: decision.parameters.intent || 'BOTH',
                context: input.context || decision.parameters.context
            });

            // If BOTH Partida and Material are found, use Construction Analyst to reconcile costs
            if (result.partida && result.material) {
                console.log(`[ResolveItem] Hybrid Match found. Invoking Construction Analyst...`);

                // Dynamic import to avoid circular deps if any
                const { constructionAnalystAgent } = await import('@/backend/ai/private/agents/construction-analyst.agent');

                const analystResult = await constructionAnalystAgent({
                    partida: result.partida,
                    material: result.material
                });

                // Since we are in Hybrid Match mode, we expect exactly 1 optimized item (for now)
                // In Phase 2, this might return multiple items if the Analyst decides to split it.
                const finalPartida = analystResult.items[0];

                if (!finalPartida) {
                    console.error('[ResolveItem] Analyst returned no items. Fallback to original.');
                    // Fallback logic could go here, but for now we assume it works.
                    return { ...result.partida, id: randomUUID(), quantity, totalPrice: result.partida.unitPrice * quantity } as BudgetPartida;
                }

                // Emit event for the HYBRID Partida
                const { emitGenerationEvent } = await import('@/backend/budget/events/budget-generation.emitter');
                const targetLeadId = input.leadId || (await import('@/backend/ai/core/context/genkit.context')).getCurrentContext()?.userId;

                if (targetLeadId) {
                    emitGenerationEvent(targetLeadId, 'item_resolved', {
                        item: finalPartida,
                        type: 'PARTIDA',
                        originalTask: input.taskDescription
                    });
                }

                return {
                    ...finalPartida,
                    id: randomUUID(),
                    quantity: quantity,
                    totalPrice: finalPartida.unitPrice * quantity,
                    originalTask: input.taskDescription,
                    note: finalPartida.note || `Hybrid Partida (Analyst Optimized)`
                } as BudgetPartida;
            }

            // Fallback: Only Partida found (Generic)
            if (result.partida) {
                // ... emit event ...
                const { emitGenerationEvent } = await import('@/backend/budget/events/budget-generation.emitter');
                const { getCurrentContext } = await import('@/backend/ai/core/context/genkit.context');
                const ctx = getCurrentContext();
                if (ctx?.userId) {
                    emitGenerationEvent(ctx.userId, 'item_resolved', {
                        item: result.partida,
                        type: 'PARTIDA',
                        originalTask: input.taskDescription
                    });
                }

                return {
                    type: 'PARTIDA',
                    id: randomUUID(),
                    order: 0,
                    code: result.partida.code,
                    description: result.partida.description,
                    unit: result.partida.unit,
                    quantity: quantity,
                    unitPrice: result.partida.unitPrice, // Use unitPrice mapped by search agent
                    totalPrice: result.partida.unitPrice * quantity,
                    originalTask: input.taskDescription,
                    note: `Generic Price Book Item. Source: ${result.source}`,
                    // relatedMaterial is undefined here
                } as BudgetPartida;
            } else if (result.material) {
                return {
                    type: 'MATERIAL',
                    id: randomUUID(),
                    order: 0,
                    sku: result.material.sku,
                    name: result.material.name,
                    description: result.material.description,
                    merchant: 'Material Catalog',
                    unit: result.material.unit,
                    quantity: quantity,
                    unitPrice: result.material.price,
                    totalPrice: result.material.price * quantity,
                    originalTask: input.taskDescription,
                    note: `Material Supply Only. Source: ${result.source}`
                } as BudgetMaterial;
            }
        } else if (decision.tool === 'askUser') {
            // Soft Interrupt...
            return {
                type: 'PARTIDA',
                id: `NEEDS-INPUT-${randomUUID().substring(0, 6)}`,
                // ... (keep existing)
                order: 0,
                code: 'USER-INPUT',
                description: `⚠️ CLARIFICATION NEEDED: ${input.taskDescription}`,
                unit: 'u',
                quantity: quantity,
                unitPrice: 0,
                totalPrice: 0,
                originalTask: input.taskDescription,
                isEstimate: true,
                note: `AI could not decide. Reasoning: ${decision.reasoning}`
            } as BudgetPartida;
        }

        // --- NEW: Try Decomposition before falling back to simple Estimation ---
        console.log(`[ResolveItem] No direct match found. Attempting Decomposition for: "${input.taskDescription}"`);

        // Dynamic import
        const { constructionAnalystAgent } = await import('@/backend/ai/private/agents/construction-analyst.agent');

        const decompositionResult = await constructionAnalystAgent({
            description: input.taskDescription,
            leadId: input.leadId
        });

        if (decompositionResult.items && decompositionResult.items.length > 0) {
            console.log(`[ResolveItem] Decomposition successful. Found ${decompositionResult.items.length} items.`);
            // NOTE: The current flow signature only supports returning ONE item.
            // To support multiple items, we need to refactor the Flow Output Schema or return a "Group Partida".
            // For now, valid hack: Return a "Chapter Summary" Partida with the breakdown as the items.

            const totalDecomposedPrice = decompositionResult.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

            return {
                type: 'PARTIDA',
                id: randomUUID(),
                order: 0,
                code: 'ASM-001', // Assembly Code
                description: `[ASSEMBLY] ${input.taskDescription} (Desglosado en ${decompositionResult.items.length} partidas)`,
                unit: 'u', // Assembly Unit
                quantity: 1, // 1 Assembly
                unitPrice: totalDecomposedPrice,
                totalPrice: totalDecomposedPrice,
                originalTask: input.taskDescription,
                isEstimate: false,
                note: `Generated via Recursive Decomposition. Items: ${decompositionResult.items.map(i => i.description).join(', ')}`,
                // We could attach the sub-items here if we extended the domain model
            } as BudgetPartida;
        }

        const estResult = await estimationAgent({
            query: decision.parameters.query,
            context: decision.parameters.context
        });

        return {
            type: 'PARTIDA',
            id: `EST-${randomUUID().substring(0, 6)}`,
            order: 0,
            code: 'EST-IA',
            description: estResult.estimation.description,
            unit: estResult.estimation.unit,
            quantity: quantity,
            unitPrice: estResult.estimation.price,
            totalPrice: estResult.estimation.price * quantity,
            originalTask: input.taskDescription,
            isEstimate: true,
            note: `Estimado por IA (${estResult.source}). ${decision.reasoning}`
        } as BudgetPartida;
    }
);
