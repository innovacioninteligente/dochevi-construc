'use server';

import { BudgetService } from '@/backend/budget/application/budget-service';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { BudgetClientData } from '@/components/budget-request/schema';
import { revalidatePath } from 'next/cache';

const budgetRepository = new BudgetRepositoryFirestore();
const budgetService = new BudgetService(budgetRepository);

export async function createBudgetAction(
    type: 'renovation' | 'quick' | 'new_build',
    clientData: BudgetClientData
) {
    try {
        // Map clientData to specs and snapshot
        const specs: any = {
            propertyType: (clientData as any).propertyType || 'flat',
            interventionType: 'partial',
            totalArea: (clientData as any).totalArea || 0,
            qualityLevel: 'medium',
            // Map other fields if available in BudgetClientData
        };

        const newBudget = await budgetService.createNewBudget({
            type,
            status: 'pending_review',
            version: 1,
            updatedAt: new Date(),
            leadId: crypto.randomUUID(), // TODO: Link to real lead
            clientSnapshot: {
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address
            },
            specs,
            chapters: [], // Initial empty chapters
            costBreakdown: {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: 0
            },
            totalEstimated: 0,
            source: 'manual',
        });

        // Revalidate admin dashboard so new budget appears immediately
        revalidatePath('/dashboard/admin/budgets');

        return { success: true, budgetId: newBudget.id };
    } catch (error) {
        console.error("Error creating budget:", error);
        return { success: false, error: "Failed to create budget" };
    }
}
