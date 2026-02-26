'use server';

import { BudgetNarrativeBuilder } from '@/backend/budget/domain/budget-narrative-builder';
import { generateBudgetFlow } from '@/backend/ai/private/flows/budget/generate-budget.flow';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/firestore-lead-repository';
import { Budget } from '@/backend/budget/domain/budget';
import { ProjectSpecs } from '@/backend/budget/domain/project-specs';
import { v4 as uuidv4 } from 'uuid';

const budgetRepository = new BudgetRepositoryFirestore();
const leadRepository = new FirestoreLeadRepository();

// ... imports
import { generateBudgetRecurseFlow } from '@/backend/ai/private/flows/generate-budget-recurse.flow';

// ... (previous code)

export async function generateBudgetFromSpecsAction(leadId: string, specs: ProjectSpecs, deepGeneration: boolean = false) {
    try {
        console.log(`>> Generating Budget from Specs (Deep Mode: ${deepGeneration})...`);

        // ... (lead validation) ... 
        let lead = await leadRepository.findById(leadId);
        if (!lead) {
            // ... (auto-create logic) ...
            const { ensureLeadProfile } = await import('@/actions/debug/fix-account.action');
            await ensureLeadProfile(leadId);
            lead = await leadRepository.findById(leadId);
            if (!lead) throw new Error("Lead not found");
        }

        // 2. Build Narrative
        const narrative = BudgetNarrativeBuilder.build(specs);
        console.log(">> Narrative built:", narrative);

        let budgetResult: any;

        // 3. Call AI Flow
        if (deepGeneration) {
            console.log(">> Using Recursive Flow (Deep Generation)");
            const recurseResult = await generateBudgetRecurseFlow({
                projectDescription: narrative,
                leadId: leadId,
                totalArea: specs.totalArea || 0
            });

            // Map Recursive Output to Standard Budget Result Structure
            let totalEstimated = 0;
            const mappedChapters = recurseResult.chapters.map((c: any, index: number) => {
                const chapterTotal = c.items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
                totalEstimated += chapterTotal;

                return {
                    id: uuidv4(),
                    name: c.name,
                    order: index + 1,
                    items: c.items.map((item: any) => ({
                        ...item,
                        id: uuidv4(),
                        type: 'PARTIDA',
                        // Ensure all required fields
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.totalPrice || 0,
                        quantity: item.quantity || 1
                    })),
                    totalPrice: chapterTotal
                };
            });

            budgetResult = {
                chapters: mappedChapters,
                totalEstimated: totalEstimated,
                costBreakdown: {
                    materialExecutionPrice: totalEstimated,
                    overheadExpenses: totalEstimated * 0.13,
                    industrialBenefit: totalEstimated * 0.06,
                    tax: totalEstimated * 0.21,
                    globalAdjustment: 0,
                    total: totalEstimated * 1.40 // Approx
                }
            };

        } else {
            // Standard Flow
            budgetResult = await generateBudgetFlow({ userRequest: narrative });
        }

        // 4. Persist Budget
        const budgetId = uuidv4();

        const newBudget: Budget = {
            id: budgetId,
            leadId: lead.id,
            clientSnapshot: lead.personalInfo,
            specs: specs,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            type: specs.interventionType === 'new_build' ? 'new_build' : 'renovation',

            // Use the mapped chapters directly
            chapters: budgetResult.chapters?.map((c: any) => ({
                ...c,
                id: c.id || uuidv4(), // Ensure ID
                items: c.items.map((i: any) => ({ ...i, id: i.id || uuidv4() }))
            })) || [],

            costBreakdown: budgetResult.costBreakdown,
            totalEstimated: budgetResult.totalEstimated,
            source: 'wizard'
        };

        await budgetRepository.save(newBudget);
        console.log(`[Action] Budget persisted with ID: ${budgetId}`);

        // Flatten items for frontend compatibility (if needed by UI result)
        const flattenedItems = newBudget.chapters.flatMap(c => c.items);

        return {
            success: true,
            budgetId,
            budgetResult: {
                ...budgetResult,
                id: budgetId,
                lineItems: flattenedItems
            }
        };

    } catch (error: any) {
        console.error("Error generating budget:", error);
        return { success: false, error: error.message };
    }
}
