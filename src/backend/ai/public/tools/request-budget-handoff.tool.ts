import { ai } from '@/backend/ai/core/config/genkit.config';
import { BudgetHandoffRequestSchema, BudgetHandoffResponseSchema, BudgetHandoffResponse } from '../protocols/handoff.schema';
import { randomUUID } from 'crypto';

/**
 * Tool used by the Public Commercial Agent to request a budget estimate
 * from the Private Backend. It ensures that specific 'partidas' are not
 * returned to the public agent's context, protecting Dochevi's IP.
 */
export const requestBudgetHandoffTool = ai.defineTool(
    {
        name: 'requestBudgetHandoff',
        description: 'Call this tool when you have collected enough information from the user (name, contact, project description) to request a preliminary budget estimate from the backend system. This will pass the lead to the internal engine.',
        inputSchema: BudgetHandoffRequestSchema,
        outputSchema: BudgetHandoffResponseSchema,
    },
    async (input): Promise<BudgetHandoffResponse> => {
        console.log(`[Handoff Tool] Received request for lead: ${input.leadName}`);

        // In a full implementation, this tool would:
        // 1. Save the Lead to the database via LeadRepository
        // 2. Wrap the 'projectDescription' and call the Private Engine
        //    (e.g., `resolveItemFlow` or a new `generateBudgetFlow`)
        // 3. For now, we simulate the Private Engine's summary response.

        // TODO: Import and call the actual `generate-budget-recurse.flow` from private/flows
        // and extract purely the Total sum to return here.

        return {
            success: true,
            estimationReferenceId: `EST-${randomUUID().substring(0, 8).toUpperCase()}`,
            commercialSummary: `Hemos analizado los requerimientos para la ${input.projectType.replace('_', ' ').toLowerCase()}. El sistema interno de Dochevi ha generado una estimación inicial y estructurado las partidas de mano de obra y materiales.`,
            suggestedNextStep: "Dile al usuario que el presupuesto detallado ya se está generando en su área privada. Anímalo a registrarse o agendar una videollamada comercial para repasar las opciones de calidades."
        };
    }
);
