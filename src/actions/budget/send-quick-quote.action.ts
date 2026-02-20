'use server';

import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { revalidatePath } from 'next/cache';
import { verifyAuth } from '@/backend/auth/auth.middleware';

interface SendQuickQuoteParams {
    budgetId: string;
    price: number;
    message: string;
}

export async function sendQuickQuoteAction({ budgetId, price, message }: SendQuickQuoteParams) {
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

        // Update Budget with Quick Quote
        budget.quickQuote = {
            price,
            message,
            answeredAt: new Date()
        };
        budget.status = 'sent'; // Mark as sent to client
        budget.updatedAt = new Date();

        // In a real app, we would trigger an email here
        console.log(`[Email Mock] Sending Quick Quote to ${budget.clientSnapshot.email}: ${price}€ - ${message}`);

        await repository.save(budget);

        revalidatePath(`/dashboard/admin/budgets/${budgetId}/edit`);
        return { success: true };

    } catch (error) {
        console.error('Error sending quick quote:', error);
        return { success: false, error: 'Failed to send quote' };
    }
}
