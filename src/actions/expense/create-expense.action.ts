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

export async function createExpenseAction(data: {
    projectId: string;
    providerName: string;
    providerCif?: string;
    invoiceNumber?: string;
    invoiceDate?: string;       // ISO string
    lines: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
        budgetChapter?: string;
        phaseId?: string;
    }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    pdfUrl?: string;
    notes?: string;
}) {
    try {
        const expense = await expenseService.createExpense(data.projectId, {
            ...data,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        });

        revalidatePath('/dashboard/expenses');
        return { success: true, expenseId: expense.id };
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return { success: false, error: error.message || 'Error al crear el gasto' };
    }
}
