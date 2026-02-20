'use server';

import { FirestoreExpenseRepository } from '@/backend/expense/infrastructure/firestore-expense-repository';
import { FirestoreProviderRepository } from '@/backend/expense/infrastructure/firestore-provider-repository';
import { FirestoreProjectRepository } from '@/backend/project/infrastructure/firestore-project-repository';
import { ExpenseService } from '@/backend/expense/application/expense-service';
import { revalidatePath } from 'next/cache';

const expenseRepository = new FirestoreExpenseRepository();
const providerRepository = new FirestoreProviderRepository();
const projectRepository = new FirestoreProjectRepository();
const expenseService = new ExpenseService(expenseRepository, providerRepository, projectRepository);

export async function rejectExpenseAction(expenseId: string) {
    try {
        const expense = await expenseService.rejectExpense(expenseId);
        revalidatePath('/dashboard/expenses');
        return { success: true, expense };
    } catch (error: any) {
        console.error('Error rejecting expense:', error);
        return { success: false, error: error.message || 'Error al rechazar el gasto' };
    }
}
