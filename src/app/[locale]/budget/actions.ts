'use server';

import { DetailedFormValues, detailedFormSchema } from '@/components/budget-request/schema';
import { buildBudgetNarrative } from '@/backend/budget/domain/budget-narrative-builder';
import { generateBudgetFlow } from '@/backend/ai/flows/budget/generate-budget.flow';

export type SubmitBudgetResult = {
    success: boolean;
    message?: string;
    narrative?: string;
    budgetResult?: {
        lineItems: any[];
        totalEstimated: number;
        costBreakdown?: {
            materialExecutionPrice: number;
            overheadExpenses: number;
            industrialBenefit: number;
            tax: number;
            globalAdjustment: number;
            total: number;
        };
    };
    errors?: any;
};

export async function submitBudgetRequest(data: DetailedFormValues): Promise<SubmitBudgetResult> {
    try {
        // 1. Validate Data on Server
        const parsed = detailedFormSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, errors: parsed.error.flatten() };
        }

        const validData = parsed.data;

        // 2. Build Narrative
        const narrative = buildBudgetNarrative(validData);
        console.log('--- Generated Budget Narrative ---');
        console.log(narrative);
        console.log('----------------------------------');

        // 3. Call AI Flow
        // Calls the orchestrator: Extraction -> Search -> Pricing
        const budgetResult = await generateBudgetFlow({ userRequest: narrative });

        return {
            success: true,
            message: 'Presupuesto preliminar generado correctamente.',
            narrative,
            budgetResult
        };

    } catch (error: any) {
        console.error('Error processing budget request:', error);
        return {
            success: false,
            message: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        };
    }
}
