'use server';

import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { revalidatePath } from 'next/cache';

const budgetRepository = new BudgetRepositoryFirestore();

export async function deleteBudgetsAction(ids: string[]): Promise<{ success: boolean; message: string; count?: number }> {
    try {
        if (!ids || ids.length === 0) {
            return { success: false, message: 'No se han seleccionado presupuestos para eliminar.' };
        }

        console.log(`[Action] Deleting ${ids.length} budgets...`);

        // Execute deletions in parallel
        await Promise.all(ids.map(id => budgetRepository.delete(id)));

        revalidatePath('/dashboard/admin/budgets');

        return {
            success: true,
            message: ids.length === 1
                ? 'Presupuesto eliminado correctamente.'
                : `${ids.length} presupuestos eliminados correctamente.`,
            count: ids.length
        };
    } catch (error) {
        console.error('[Action] Error deleting budgets:', error);
        return {
            success: false,
            message: 'Error al eliminar los presupuestos. Por favor, inténtelo de nuevo.'
        };
    }
}
