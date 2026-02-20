import { ai } from '@/backend/ai/config/genkit.config';
import { z } from 'genkit';
import { priceBookRetrieverTool } from '@/backend/ai/tools/price-book-retriever.tool';
import { materialRetrieverTool } from '@/backend/ai/tools/material-retriever.tool';

export const budgetSearchAgent = ai.defineFlow(
    {
        name: 'budgetSearchAgent',
        inputSchema: z.object({
            query: z.string().describe('The construction task or material to find'),
            generic_query: z.string().optional().describe('Fallback query for Price Book'),
            intent: z.enum(['PARTIDA', 'MATERIAL', 'BOTH']).optional().default('BOTH'),
        }),
        outputSchema: z.object({
            partida: z.any().optional(), // Typed loosely for now, will map to BudgetPartida
            material: z.any().optional(), // Typed loosely for now, will map to BudgetMaterial
            confidence: z.number(),
            source: z.string(),
        }),
    },
    async (input) => {
        console.log(`[BudgetSearch] INPUT: ${JSON.stringify(input, null, 2)}`);
        let partidaMatch = null;
        let materialMatch = null;

        // 1. Search Price Book (Task/Labor + Material)
        // Logic: If generic_query is present, we try to find a Partida even if intent is MATERIAL,
        // because we want to link the material to a task.
        if (input.intent === 'BOTH' || input.intent === 'PARTIDA' || (input.intent === 'MATERIAL' && input.generic_query)) {
            let pbResult: any = { items: [] };

            // Only try specific query if intent is NOT 'MATERIAL' (specific material brands won't be in PB)
            if (input.intent !== 'MATERIAL') {
                pbResult = await priceBookRetrieverTool({ query: input.query, limit: 1, year: 2024 });
            }

            // Fallback to generic query if specific failed OR if we skipped specific search
            if ((!pbResult.items || pbResult.items.length === 0) && input.generic_query) {
                console.log(`[BudgetSearch] Specific PB search failed/skipped. Retrying with generic: "${input.generic_query}"`);
                pbResult = await priceBookRetrieverTool({ query: input.generic_query, limit: 1, year: 2024 });
            }

            if (pbResult.items && pbResult.items.length > 0) {
                partidaMatch = pbResult.items[0];
            }
        }

        // 2. Search Material Catalog (Product Only)
        // If the user specifically asked for a material, or if we want to augment the Partida with a specific product price
        if (input.intent === 'BOTH' || input.intent === 'MATERIAL') {
            console.log(`[BudgetSearch] searching material with query: ${input.query}`);
            const matResult = await materialRetrieverTool({ query: input.query, limit: 1 });

            // Write result to file for inspection
            const fs = await import('fs');
            fs.writeFileSync('debug_mat_result.json', JSON.stringify(matResult, null, 2), 'utf-8');
            console.log(`[BudgetSearch] matResult written to debug_mat_result.json`);

            if (matResult.items && matResult.items.length > 0) {
                materialMatch = matResult.items[0];
            }
        }

        // Map PriceBookItem to BudgetPartida structure if found
        let mappedPartida = null;
        if (partidaMatch) {
            mappedPartida = {
                type: 'PARTIDA',
                id: partidaMatch.id,
                code: partidaMatch.code,
                description: partidaMatch.description,
                unit: partidaMatch.unit,
                unitPrice: (partidaMatch.priceTotal !== undefined && partidaMatch.priceTotal !== null && partidaMatch.priceTotal > 0)
                    ? partidaMatch.priceTotal
                    : (partidaMatch.breakdown ? partidaMatch.breakdown.reduce((sum: number, b: any) => sum + (b.price * b.quantity), 0) : 0),
                totalPrice: 0, // Calculated later based on quantity
                quantity: 1, // Default, updated by flow
                breakdown: partidaMatch.breakdown ? partidaMatch.breakdown.map((b: any) => ({
                    concept: b.description,
                    type: (b.code.startsWith('mo') || b.code.startsWith('mq')) ? 'LABOR' : 'MATERIAL', // Heuristic
                    price: b.price,
                    yield: b.quantity,
                    total: b.price * b.quantity,
                    waste: 0
                })) : []
            };
        }

        return {
            partida: mappedPartida,
            material: materialMatch,
            confidence: mappedPartida ? 0.9 : (materialMatch ? 0.8 : 0),
            source: 'vector-search'
        };
    }
);
