
import { z } from 'zod';
import { ai, embeddingModel } from '@/backend/ai/config/genkit.config';
import { FirestorePriceBookRepository } from '@/backend/price-book/infrastructure/firestore-price-book-repository';

const priceBookRepo = new FirestorePriceBookRepository();

export const priceBookRetrieverTool = ai.defineTool(
    {
        name: 'priceBookRetriever',
        description: 'Searches for construction price book items using semantic vector search. Use this to find prices and descriptions for construction tasks.',
        inputSchema: z.object({
            query: z.string().describe('The search query or description of the construction task to look for.'),
            limit: z.number().optional().default(5).describe('Number of items to return.'),
            year: z.number().optional().default(2024).describe('Year of the price book to search in.'),
        }),
        outputSchema: z.object({
            items: z.array(z.object({
                code: z.string(),
                description: z.string(),
                priceTotal: z.number(),
                unit: z.string(),
            })),
        }),
    },
    async (input) => {
        try {
            console.log(`[Tool:PriceBookRetriever] Searching for: "${input.query}" (Year: ${input.year})`);

            // 1. Generate Embedding for the query
            const embeddingResult = await ai.embed({
                embedder: embeddingModel,
                content: input.query,
            });

            // Handle array or object return type from Genkit
            const embedding = Array.isArray(embeddingResult)
                ? embeddingResult[0].embedding
                : (embeddingResult as any).embedding;

            // 2. Search in Repository
            const results = await priceBookRepo.searchByVector(embedding, input.limit, input.year);

            console.log(`[Tool:PriceBookRetriever] Found ${results.length} items.`);

            // 3. Map to output schema (keep it minimal/token-efficient for LLM)
            return {
                items: results.map(item => ({
                    code: item.code,
                    description: item.description,
                    priceTotal: item.priceTotal,
                    unit: item.unit,
                }))
            };
        } catch (error) {
            console.error('[Tool:PriceBookRetriever] Error:', error);
            // Return empty array on error to avoid crashing the flow
            return { items: [] };
        }
    }
);
