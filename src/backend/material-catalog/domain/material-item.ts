
import { z } from 'zod';

// Zod Schema for validation and AI output
export const MaterialItemSchema = z.object({
    id: z.string().optional(),
    sku: z.string().describe("Unique reference code from Obramat (e.g. '104562')"),
    name: z.string().describe("Product name"),
    description: z.string().describe("Full product description details"),
    category: z.string().describe("Product category hierarchy (e.g. 'Construction > Cement')"),
    price: z.number().describe("Unit price"),
    unit: z.string().describe("Unit of measure (ud, m2, m, kg, l, etc.)"),
    year: z.number().optional().describe("Catalog year (e.g. 2025)"),
    imageOnly: z.boolean().optional().describe("True if extracted from image-only page"),
    embedding: z.array(z.number()).optional().describe("Vector embedding for semantic search"),
    metadata: z.object({
        page: z.number(),
        catalogSource: z.string(),
        year: z.number(),
        rawText: z.string().optional(),
        usage: z.object({
            tokens: z.number().optional()
        }).optional()
    }).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

export type MaterialItem = z.infer<typeof MaterialItemSchema>;
