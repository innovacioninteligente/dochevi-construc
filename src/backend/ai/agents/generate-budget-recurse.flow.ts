
import { ai } from '@/backend/ai/config/genkit.config';
import { z } from 'genkit';
import { constructionArchitectAgent } from '@/backend/ai/agents/construction-architect.agent';
import { resolveItemFlow } from '@/backend/ai/agents/resolve-item.flow';
import { BudgetPartida } from '@/backend/budget/domain/budget';

// Input: Project Description
// Input: Project Description + Context
const GenerateBudgetRecurseInputSchema = z.object({
    projectDescription: z.string(),
    leadId: z.string(),
    totalArea: z.number().optional(),
    projectContext: z.string().optional() // E.g. "4th Floor, No Elevator"
});

// Output: Budget with Categories (Chapters)
const GenerateBudgetRecurseOutputSchema = z.object({
    projectTitle: z.string(),
    chapters: z.array(z.object({
        name: z.string(),
        items: z.array(z.any()) // Using any mainly because resolveItemFlow returns various structures, we need to standardize
    })),
    totalScore: z.number().optional()
});

export const generateBudgetRecurseFlow = ai.defineFlow(
    {
        name: 'generateBudgetRecurseFlow',
        inputSchema: GenerateBudgetRecurseInputSchema,
        outputSchema: GenerateBudgetRecurseOutputSchema,
    },
    async (input) => {
        console.log(`[RecursiveFlow] Starting for: "${input.projectDescription}"`);

        // 1. Architect: Break down into chapters
        const architectResult = await constructionArchitectAgent({
            projectDescription: input.projectDescription,
            totalArea: input.totalArea
        });

        const chaptersData: any[] = [];

        // 2. Loop through Chapters and Resolve Items
        // In a real scenario, we might want to parallelize this, but purely sequential for now to avoid rate limits
        for (const chapter of architectResult.chapters) {
            console.log(`[RecursiveFlow] Processing Chapter: ${chapter.name}`);

            // Emit Chapter Start (Explicit leadId)
            const { emitGenerationEvent } = await import('@/backend/budget/events/budget-generation.emitter');
            // We use input.leadId now, ignoring ctx

            if (input.leadId) {
                emitGenerationEvent(input.leadId, 'chapter_start', { name: chapter.name });
            }

            // Call Analyst to Decompose the Chapter into Items
            // We bypass resolveItemFlow because we KNOW this is a complex chapter needing breakdown
            const { constructionAnalystAgent } = await import('@/backend/ai/agents/construction-analyst.agent');

            // Enrich description with quantity context if available
            let promptDescription = `${chapter.name}: ${chapter.description}`;
            if (chapter.approxQuantity) {
                promptDescription += ` (Total Estimates: ${chapter.approxQuantity} ${chapter.unit || ''})`;
            }

            console.log(`[RecursiveFlow] Decomposing: ${promptDescription}`);

            const analystResult = await constructionAnalystAgent({
                description: promptDescription,
                leadId: input.leadId,
                projectContext: input.projectDescription // Pass full context (floor, elevator, etc.)
            });

            // Analyst returns already priced items
            const items: (import('@/backend/budget/domain/budget').BudgetPartida | import('@/backend/budget/domain/budget').BudgetMaterial)[] = analystResult.items || [];

            // Fallback if empty (shouldn't happen with robust Analyst, but safe check)
            if (items.length === 0) {
                // Use resolveItemFlow as backup for single item
                const backupItem = await resolveItemFlow({
                    taskDescription: promptDescription,
                    quantity: 1,
                    unit: 'ud',
                    leadId: input.leadId
                });
                items.push(backupItem);
            }

            chaptersData.push({
                name: chapter.name,
                description: chapter.description,
                items: items
            });
        }

        return {
            projectTitle: input.projectDescription,
            chapters: chaptersData,
            totalScore: 100
        };
    }
);
