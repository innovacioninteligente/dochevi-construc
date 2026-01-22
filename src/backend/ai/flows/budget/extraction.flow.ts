import { genkit, z } from 'genkit';
import { ai } from '@/backend/ai/config/genkit.config';

// Define strict output schema
const SubtaskExtractionSchema = ai.defineSchema(
    'SubtaskExtractionSchema',
    z.object({
        subtasks: z.array(z.object({
            searchQuery: z.string().describe("Specific search query for price book"),
            quantity: z.number().describe("Estimated quantity"),
            unit: z.string().describe("m2, u, m, etc."),
            reasoning: z.string().optional()
        })).describe("List of construction tasks found in the request"),
    })
);

export const extractionFlow = ai.defineFlow(
    {
        name: 'extractionFlow',
        inputSchema: z.object({
            userRequest: z.string(),
        }),
        outputSchema: SubtaskExtractionSchema,
    },
    async (input) => {
        // Load from .prompt file (which must reference 'SubtaskExtractionSchema')
        const prompt = ai.prompt('subtask-extraction');

        const result = await prompt({
            userRequest: input.userRequest,
        });

        if (!result.output) {
            throw new Error('Failed to generate subtasks');
        }

        return result.output;
    }
);
