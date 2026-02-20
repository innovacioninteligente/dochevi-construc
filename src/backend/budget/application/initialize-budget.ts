import { Budget } from '@/backend/budget/domain/budget';
import { ProjectSpecs } from '@/backend/budget/domain/project-specs';
import { LeadRepository } from '@/backend/lead/domain/lead-repository';
import { BudgetRepository } from '@/backend/budget/domain/budget'; // Note: Interface is exported from budget.ts
import { v4 as uuidv4 } from 'uuid';

export class InitializeBudget {
    constructor(
        private leadRepository: LeadRepository,
        private budgetRepository: BudgetRepository
    ) { }

    async execute(leadId: string, specs: ProjectSpecs): Promise<Budget> {
        // 1. Fetch Lead (to snapshot client data)
        const lead = await this.leadRepository.findById(leadId);
        if (!lead) throw new Error(`Lead not found: ${leadId}`);

        // 2. Create Budget Entity
        const budget: Budget = {
            id: uuidv4(),
            leadId: lead.id,
            clientSnapshot: {
                name: lead.personalInfo.name,
                email: lead.personalInfo.email,
                phone: lead.personalInfo.phone
            },
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            type: specs.interventionType === 'new_build' ? 'new_build' : 'renovation',
            specs: specs,
            chapters: [], // Fresh budget
            costBreakdown: {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: 0
            },
            totalEstimated: 0,
            source: 'wizard'
        };

        // 3. Persist
        await this.budgetRepository.save(budget);

        return budget;
    }
}
