
import { z } from 'zod';

// Zod Schema for validation (Can be used in Application/Interface layers)
export const PriceBookItemSchema = z.object({
    id: z.string().optional(),
    code: z.string().describe("The unique code of the item from the PDF (e.g., 'D01.05')"),
    description: z.string().describe("Full description of the construction task"),
    unit: z.string().describe("Unit of measurement (e.g., 'm2', 'u', 'ml')"),
    priceLabor: z.number().describe("Cost of labor per unit"),
    priceMaterial: z.number().describe("Cost of materials per unit"),
    priceTotal: z.number().describe("Total execution cost (Material + Labor)"),
    year: z.number().describe("Year of the price book"),
    searchKeywords: z.array(z.string()).optional(),
    // embedding: z.array(z.number()).optional(), // Optional if we handle it in infrastructure specific models
    createdAt: z.date().optional(),
});

/**
 * Domain Entity: PriceBookItem
 */
export interface PriceBookItem {
    id?: string;
    code: string;
    description: string;
    unit: string;
    priceLabor: number;
    priceMaterial: number;
    priceTotal: number;
    year: number;
    searchKeywords?: string[];
    embedding?: number[];
    createdAt?: Date;
}
