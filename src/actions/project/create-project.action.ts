'use server';

import { FirestoreProjectRepository } from '@/backend/project/infrastructure/firestore-project-repository';
import { ProjectService } from '@/backend/project/application/project-service';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { revalidatePath } from 'next/cache';

const projectRepository = new FirestoreProjectRepository();
const budgetRepository = new BudgetRepositoryFirestore();
const projectService = new ProjectService(projectRepository);

export async function createProjectAction(data: {
    budgetId: string;
    name?: string;
    description?: string;
    address?: string;
    startDate?: string;        // ISO string from frontend
    estimatedEndDate?: string;  // ISO string from frontend
}) {
    try {
        const budget = await budgetRepository.findById(data.budgetId);
        if (!budget) {
            return { success: false, error: 'Presupuesto no encontrado' };
        }

        const project = await projectService.createFromBudget(budget, {
            name: data.name,
            description: data.description,
            address: data.address,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined,
        });

        revalidatePath('/dashboard/projects');
        return { success: true, projectId: project.id };
    } catch (error: any) {
        console.error('Error creating project:', error);
        return { success: false, error: error.message || 'Error al crear la obra' };
    }
}
