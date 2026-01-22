
import { z } from 'zod';

// Schema for a single Price Book Item (Partida)
export const PriceBookItemSchema = z.object({
    id: z.string().optional(), // Firestore ID
    code: z.string().describe("The unique code of the item from the PDF (e.g., 'D01.05')"),
    description: z.string().describe("Full description of the construction task"),
    unit: z.string().describe("Unit of measurement (e.g., 'm2', 'u', 'ml')"),
    priceLabor: z.number().describe("Cost of labor per unit"),
    priceMaterial: z.number().describe("Cost of materials per unit"),
    priceTotal: z.number().describe("Total execution cost (Material + Labor)"),
    // Metadata for vector search context
    year: z.number().optional().describe("Year of the price book"),
    embedding: z.array(z.number()).optional().describe("Vector embedding of the description"),
});

export type PriceBookItem = z.infer<typeof PriceBookItemSchema>;

// Schema for the AI Budget Output
export const BudgetLineItemSchema = PriceBookItemSchema.extend({
    quantity: z.number().describe("Estimated quantity required"),
    totalLineCost: z.number().describe("quantity * priceTotal"),
    reasoning: z.string().optional().describe("Why the AI selected this item"),
});

export type BudgetLineItem = z.infer<typeof BudgetLineItemSchema>;

export const BudgetSchema = z.object({
    projectId: z.string(),
    items: z.array(BudgetLineItemSchema),
    totalDirectCost: z.number().describe("Sum of all line items"),
    margin: z.number().describe("Profit margin percentage (e.g., 0.40 for 40%)"),
    totalWithMargin: z.number().describe("Total Direct Cost * (1 + Margin)"),
    currency: z.literal('EUR').default('EUR'),
    status: z.enum(['draft', 'reviewed', 'sent', 'accepted']).default('draft'),
    createdAt: z.date().optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
