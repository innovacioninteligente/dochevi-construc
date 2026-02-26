import { z } from 'zod';

// Define what the Public Agent must gather before handing off
export const BudgetHandoffRequestSchema = z.object({
    leadName: z.string().describe("Name of the prospective client"),
    leadContact: z.string().describe("Email or phone number for the lead"),
    projectDescription: z.string().describe("Comprehensive description of what the user wants to build or renovate"),
    projectType: z.enum(['REFORMA_INTEGRAL', 'REFORMA_BANO', 'REFORMA_COCINA', 'OBRA_NUEVA', 'OTRO']).describe("Categorized type of the project"),
    estimatedBudgetAmount: z.number().optional().describe("User's target budget, if mentioned"),
    propertySize: z.number().optional().describe("Size in square meters, if known"),
    imagesProvided: z.boolean().describe("Whether the user provided images for context")
});

export type BudgetHandoffRequest = z.infer<typeof BudgetHandoffRequestSchema>;

// Define the sanitized response that comes BACK to the public agent
export const BudgetHandoffResponseSchema = z.object({
    success: z.boolean(),
    estimationReferenceId: z.string().describe("A tracking ID for the generated estimation"),
    commercialSummary: z.string().describe("A sanitized, high-level summary of the budget (e.g. total estimated cost). Does NOT contain specific partidas."),
    suggestedNextStep: z.string().describe("Instructions for the commercial agent on what to tell the user next (e.g., 'We have generated an estimate of roughly 15,000€. Ask them to schedule a call.')")
});

export type BudgetHandoffResponse = z.infer<typeof BudgetHandoffResponseSchema>;
