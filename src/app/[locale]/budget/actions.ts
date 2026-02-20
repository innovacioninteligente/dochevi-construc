'use server';

import { DetailedFormValues, detailedFormSchema } from '@/components/budget-request/schema';
import { BudgetNarrativeBuilder } from '@/backend/budget/domain/budget-narrative-builder';
import { FormToSpecsMapper } from '@/backend/budget/application/mappers/form-to-specs.mapper';
import { generateBudgetFlow } from '@/backend/ai/flows/budget/generate-budget.flow';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';
import { runWithContext } from '@/backend/ai/context/genkit.context';
import { randomUUID } from 'crypto';
import { verifyAuth } from '@/backend/auth/auth.middleware';
import { aiRateLimiter } from '@/backend/security/rate-limiter';
import { auditLogger } from '@/backend/security/audit-logger';
// import { auth } from '@/backend/shared/infrastructure/auth';

// Assuming some auth helper exists or we use currentUser from clerk/next-auth,
// but for now let's leave userId optional or check header if available.
// Ideally, we should use a session helper. Let's use a dummy ID or null for now if no auth.

// We need a simple ID generator since uuid might not be available
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export type SubmitBudgetResult = {
    success: boolean;
    message?: string;
    narrative?: string;
    budgetResult?: {
        lineItems: any[];
        totalEstimated: number;
        costBreakdown?: {
            materialExecutionPrice: number;
            overheadExpenses: number;
            industrialBenefit: number;
            tax: number;
            globalAdjustment: number;
            total: number;
        };
        id?: string; // Return the ID of the saved budget
    };
    errors?: any;
};

const budgetRepository = new BudgetRepositoryFirestore();

export async function submitBudgetRequest(data: DetailedFormValues): Promise<SubmitBudgetResult> {
    const authResult = await verifyAuth(false); // Optional auth for now, or true if strict
    const userId = authResult?.userId || 'guest-' + randomUUID();
    const userRole = authResult?.role || 'guest';

    // 1. Rate Limiting
    const isAllowed = await aiRateLimiter.isAllowed(userId);
    if (!isAllowed) {
        await auditLogger.log({
            action: 'generate_budget_rate_limit',
            userId,
            status: 'failure',
            details: { reason: 'Rate limit exceeded' }
        });
        return { success: false, message: 'Has excedido el límite de solicitudes. Por favor, espera un momento.' };
    }

    try {
        // 2. Validate Data on Server
        const parsed = detailedFormSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, errors: parsed.error.flatten() };
        }

        const validData = parsed.data;

        // 3. Build Narrative
        // Map form values to domain specs
        const specs = FormToSpecsMapper.map(validData);
        // Build narrative from specs
        const narrative = BudgetNarrativeBuilder.build(specs);
        console.log('--- Generated Budget Narrative ---');
        console.log(narrative);
        console.log('----------------------------------');

        // 4. Call AI Flow
        // Calls the orchestrator: Extraction -> Search -> Pricing
        // Wrap with Genkit Context to propagate Auth/Session
        const budgetResult = await runWithContext({
            userId,
            role: userRole,
            sessionId: 'session-' + Date.now(),
            traceId: randomUUID()
        }, async () => {
            // Audit Start
            await auditLogger.log({
                action: 'generate_budget_start',
                userId,
                details: { narrativeShort: narrative.substring(0, 100) },
                status: 'success'
            });

            const result = await generateBudgetFlow({ userRequest: narrative });
            return result;
        });

        // 5. Persist Budget
        const budgetId = generateId();

        // Create Client Snapshot
        const clientSnapshot = {
            name: validData.name,
            email: validData.email,
            phone: validData.phone,
            address: validData.address
        };

        const newBudget: Budget = {
            id: budgetId,
            leadId: generateId(), // TODO: Properly create/link Lead entity in a separate step or here
            clientSnapshot,
            status: 'draft', // Initial status
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            specs, // Use the mapped specs
            chapters: (budgetResult as any).chapters?.map((c: any) => ({
                id: c.id || generateId(),
                name: c.name || "Partidas",
                order: c.order || 0,
                items: c.items.map((i: any) => ({ ...i, id: generateId(), type: 'PARTIDA' })),
                totalPrice: c.totalPrice || 0
            })) || [{
                id: generateId(),
                name: "Presupuesto Base",
                order: 0,
                items: (budgetResult as any).lineItems?.map((item: any) => ({
                    ...item,
                    type: 'PARTIDA',
                    id: generateId(),
                    isEditing: false
                })) || [],
                totalPrice: budgetResult.totalEstimated
            }],
            costBreakdown: budgetResult.costBreakdown || {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: budgetResult.totalEstimated
            },
            totalEstimated: budgetResult.totalEstimated
        };

        await budgetRepository.save(newBudget);
        console.log(`[Action] Budget persisted with ID: ${budgetId}`);

        return {
            success: true,
            message: 'Presupuesto preliminar generado correctamente.',
            narrative,
            budgetResult: {
                ...budgetResult,
                id: budgetId, // Return ID to client so we can redirect/edit if needed
                lineItems: newBudget.chapters.flatMap(c => c.items)
            }
        };

    } catch (error: any) {
        console.error('Error processing budget request:', error);
        return {
            success: false,
            message: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        };
    }
}
