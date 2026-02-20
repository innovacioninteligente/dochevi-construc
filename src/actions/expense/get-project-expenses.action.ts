'use server';

import { FirestoreExpenseRepository } from '@/backend/expense/infrastructure/firestore-expense-repository';
import { Expense } from '@/backend/expense/domain/expense';

const expenseRepository = new FirestoreExpenseRepository();

export async function getProjectExpensesAction(projectId: string): Promise<Expense[]> {
    try {
        return await expenseRepository.findByProjectId(projectId);
    } catch (error) {
        console.error('Error fetching project expenses:', error);
        return [];
    }
}

export async function getAllExpensesAction(): Promise<Expense[]> {
    try {
        return await expenseRepository.findAll();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
}
