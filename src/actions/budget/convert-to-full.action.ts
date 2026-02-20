'use server';

import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { revalidatePath } from 'next/cache';
import { verifyAuth } from '@/backend/auth/auth.middleware';

export async function convertToFullBudgetAction(budgetId: string) {
    try {
        const auth = await verifyAuth(true); // Require admin
        if (!auth) {
            return { success: false, error: 'Unauthorized' };
        }

        const repository = new BudgetRepositoryFirestore();
        const budget = await repository.findById(budgetId);

        if (!budget) {
            return { success: false, error: 'Budget not found' };
        }

        // Convert Type
        budget.type = 'renovation'; // Upgrade to full renovation
        budget.updatedAt = new Date();

        await repository.save(budget);

        revalidatePath(`/dashboard/admin/budgets/${budgetId}/edit`);
        return { success: true };

    } catch (error) {
        console.error('Error converting budget:', error);
        return { success: false, error: 'Failed to convert budget' };
    }
}
