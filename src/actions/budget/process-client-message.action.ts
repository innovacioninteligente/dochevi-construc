'use server';

import { clientRequirementsFlow } from '@/backend/ai/public/flows/client-requirements.flow';
import { BudgetRequirement } from '@/backend/budget/domain/budget-requirements';

export async function processClientMessageAction(
    message: string,
    history: any[],
    currentRequirements: Partial<BudgetRequirement>
) {
    try {
        const result = await clientRequirementsFlow({
            userMessage: message,
            history,
            currentRequirements,
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Error processing client message:", error);
        return { success: false, error: "Failed to process message" };
    }
}
