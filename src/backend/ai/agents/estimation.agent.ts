import { ai } from '@/backend/ai/config/genkit.config';

import { z } from 'genkit';

import { webPriceSearchTool } from '@/backend/ai/tools/web-price-search.tool';

export const estimationAgent = ai.defineFlow(
    {
        name: 'estimationAgent',
        inputSchema: z.object({
            query: z.string().describe('The item to estimate'),
            context: z.string().optional().describe('Additional context like "luxury", "high-end", etc.'),
        }),
        outputSchema: z.object({
            estimation: z.any(), // Maps to the output of webPriceSearchTool
            confidence: z.number(),
            source: z.string(),
        }),
    },
    async (input) => {
        // We can enhance the query with context if provided
        const searchQuery = input.context ? `${input.query} ${input.context}` : input.query;

        console.log(`[EstimationAgent] Estimating: ${searchQuery}`);

        try {
            const result = await webPriceSearchTool({ query: searchQuery });

            return {
                estimation: result,
                confidence: result.confidence || 0.5,
                source: 'web-estimation'
            };
        } catch (error) {
            console.error("[EstimationAgent] Failed:", error);
            throw new Error(`Failed to estimate price for ${searchQuery}`);
        }
    }
);
